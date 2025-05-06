import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (photo: Blob) => void;
  cameraFacing: "user" | "environment";
  instruction?: string;
  frontPreview?: Blob | null;
};

const CameraCapture = ({ onCapture, cameraFacing, instruction, frontPreview }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraFacing } });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (err) {
        setError("Camera access denied");
      }
    };

    startCamera();
    return () => streamRef.current?.getTracks().forEach((track) => track.stop());
  }, [cameraFacing]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => blob && onCapture(blob), "image/jpeg");
  };

  return (
    <div className="relative flex flex-col items-center space-y-4">
      {instruction && <p className="text-sm text-zinc-400 text-center">{instruction}</p>}
      {error ? (
        <p className="text-red-400">{error}</p>
      ) : (
        <div className="relative w-full max-w-md aspect-[3/4] border border-zinc-700 rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          {frontPreview && (
            <img
              src={URL.createObjectURL(frontPreview)}
              alt="Front selfie"
              className="absolute top-2 right-2 w-24 h-32 object-cover border-2 border-white rounded-xl shadow-lg"
            />
          )}
        </div>
      )}
      <button
        onClick={handleCapture}
        className="w-16 h-16 rounded-full border-4 border-white hover:scale-105 transition"
      />
    </div>
  );
};

export default CameraCapture;
