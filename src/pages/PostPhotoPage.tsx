import { useEffect, useState } from "react";
import CameraCapture from "@/components/Post/CameraCapture";
import DualCameraCapture from "@/components/Post/DualCameraCapture";
import PhotoPreview from "@/components/Post/PhotoPreview";
import PageWrapper from "@/components/UI/PageWrapper";

type CapturedPhoto = {
  front: Blob | null;
  back: Blob | null;
};

const PostPhotoPage = () => {
  const [step, setStep] = useState<"front" | "back" | "preview" | "dual">("front");
  const [photos, setPhotos] = useState<CapturedPhoto>({ front: null, back: null });
  const [description, setDescription] = useState("");
  const [dualSupported, setDualSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Try to access both streams in parallel
    const checkDualSupport = async () => {
      try {
        const [userStream, envStream] = await Promise.all([
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }),
          navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }),
        ]);
        userStream.getTracks().forEach((t) => t.stop());
        envStream.getTracks().forEach((t) => t.stop());
        setDualSupported(true);
        setStep("dual");
      } catch {
        setDualSupported(false);
        setStep("front");
      }
    };

    checkDualSupport();
  }, []);

  const handlePhotoCapture = (photo: Blob) => {
    if (step === "front") {
      setPhotos((prev) => ({ ...prev, front: photo }));
      setStep("back");
    } else if (step === "back") {
      setPhotos((prev) => ({ ...prev, back: photo }));
      setStep("preview");
    }
  };

  const handleDualCapture = (front: Blob, back: Blob) => {
    setPhotos({ front, back });
    setStep("preview");
  };

  const handleRetake = () => {
    setPhotos({ front: null, back: null });
    setStep(dualSupported ? "dual" : "front");
  };

  return (
    <PageWrapper title="Post Your Moment">
      {step === "preview" ? (
        <PhotoPreview frontPhoto={photos.front} backPhoto={photos.back} onRetake={handleRetake} />
      ) : (
        <DualCameraCapture
          onCapture={(front, back) => {
            setPhotos({ front, back });
            setStep("preview");
          }}
        />
      )}
    </PageWrapper>
  );
};

export default PostPhotoPage;
