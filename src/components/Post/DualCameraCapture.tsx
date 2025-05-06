import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (front: Blob, back: Blob) => void;
};

const DualCameraCapture = ({ onCapture }: Props) => {
  const frontVideoRef = useRef<HTMLVideoElement>(null);
  const backVideoRef = useRef<HTMLVideoElement>(null);

  const frontStreamRef = useRef<MediaStream | null>(null);
  const backStreamRef = useRef<MediaStream | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    const startCameras = async () => {
      try {
        const [frontStream, backStream] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }),
        ]);

        frontStreamRef.current = frontStream;
        backStreamRef.current = backStream;

        if (frontVideoRef.current) frontVideoRef.current.srcObject = frontStream;
        if (backVideoRef.current) backVideoRef.current.srcObject = backStream;
      } catch (err) {
        console.error("Dual camera access failed", err);
        setError("Your device/browser does not support dual camera preview.");
      }
    };

    startCameras();

    return () => {
      frontStreamRef.current?.getTracks().forEach((t) => t.stop());
      backStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = () => {
    if (!frontVideoRef.current || !backVideoRef.current) return;

    const capture = (video: HTMLVideoElement): Blob | null => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return canvas.toDataURL("image/jpeg");
    };

    const frontCanvas = document.createElement("canvas");
    const backCanvas = document.createElement("canvas");

    const captureBlob = (video: HTMLVideoElement): Promise<Blob> =>
      new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          canvas.toBlob((blob) => blob && resolve(blob), "image/jpeg");
        }
      });

    Promise.all([
      captureBlob(frontVideoRef.current),
      captureBlob(backVideoRef.current),
    ]).then(([front, back]) => {
      onCapture(front, back);
    });
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="relative w-full max-w-md aspect-[3/4] border border-zinc-700 rounded-xl overflow-hidden">
          <video
            ref={backVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          <video
            ref={frontVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-2 right-2 w-24 h-32 object-cover border-2 border-white rounded-xl shadow-lg"
          />
        </div>
      )}
      <button
        onClick={handleCapture}
        className="w-16 h-16 rounded-full border-4 border-white hover:scale-105 transition"
      />
    </div>
  );
};

export default DualCameraCapture;
