import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (front: Blob, back: Blob) => void;
};

const DualCameraCapture = ({ onCapture }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<"front" | "back" | "done">("front");
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string>("");
  const [useFallback, setUseFallback] = useState(false);

  // Detect iOS
  useEffect(() => {
    const isIos = /iPad|iPhone|iPod|Safari/.test(navigator.userAgent);
    if (isIos) {
      setUseFallback(true);
    }
  }, []);

  // Start camera for video preview (used when not using fallback)
  useEffect(() => {
    if (useFallback || step === "done") return;

    const startCamera = async () => {
      try {
        // stop existing tracks
        streamRef.current?.getTracks().forEach(t => t.stop());

        const mode = step === "front" ? "user" : "environment";
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
        streamRef.current = stream;

        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        await video.play();
      } catch (err) {
        console.error("Camera error:", err);
        setError("Camera not accessible on this device/browser.");
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [step, useFallback]);

  // Handle capture for both video and fallback modes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (step === "front") {
      setFrontBlob(file);
      setStep("back");
    } else {
      onCapture(frontBlob!, file);
      setStep("done");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      if (step === "front") {
        setFrontBlob(blob);
        setStep("back");
      } else {
        onCapture(frontBlob!, blob);
        setStep("done");
      }
    }, "image/jpeg");
  };

  // Render fallback for iOS PWA
  if (useFallback) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <input
          key={step}
          type="file"
          accept="image/*"
          capture={step === "front" ? "user" : "environment"}
          onChange={handleFileChange}
          className="w-full max-w-md p-4 bg-zinc-800 text-white rounded"
        />
        <p className="text-sm text-zinc-400">
          {step === "front" ? "Snap a selfie" : "Now snap the back-camera photo"}
        </p>
      </div>
    );
  }

  // If video camera mode
  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (step === "done") {
    return <p className="text-zinc-400 text-center">Photos captured!</p>;
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-full max-w-md aspect-[3/4] border border-zinc-700 rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          muted
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={capturePhoto}
        className="w-16 h-16 rounded-full border-4 border-white hover:scale-105 transition"
      />
      <p className="text-sm text-zinc-400">
        {step === "front" ? "Capture front photo" : "Capture back photo"}
      </p>
    </div>
  );
};

export default DualCameraCapture;
