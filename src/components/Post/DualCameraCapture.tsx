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

  const getFacingMode = () => {
    return step === "front" ? "user" : "environment";
  };

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: getFacingMode() },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Camera not accessible on this device.");
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [step]);

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
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

  if (step === "done") {
    return (
      <p className="text-zinc-400 text-center">Photos captured. Processing...</p>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="relative w-full max-w-md aspect-[3/4] border border-zinc-700 rounded-xl overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <button
        onClick={capturePhoto}
        className="w-16 h-16 rounded-full border-4 border-white hover:scale-105 transition"
      >
        {/* Capture button (can be styled better) */}
      </button>

      <p className="text-sm text-zinc-400">
        {step === "front" ? "Capture front photo" : "Capture back photo"}
      </p>
    </div>
  );
};

export default DualCameraCapture;
