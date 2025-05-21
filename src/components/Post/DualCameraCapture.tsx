import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (front: Blob, back: Blob) => void;
};

const DualCameraCapture = ({ onCapture }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<"front" | "back" | "done">("front");
  const [frontBlob, setFrontBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");

  // Determine which camera to open
  const getFacingMode = () => (step === "front" ? "user" : "environment");

  // Start camera whenever `step` changes
  useEffect(() => {
    const startCamera = async () => {
      try {
        // stop existing tracks
        streamRef.current?.getTracks().forEach(t => t.stop());

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: getFacingMode() },
          audio: false,
        });

        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;

        // iOS requires webkit-playsinline AND a manual play()
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
  }, [step]);

  const capturePhoto = () => {
    const video = videoRef.current!;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d")!;
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
          // both attrs are needed for iOS
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
