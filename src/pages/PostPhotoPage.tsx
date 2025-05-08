import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { account, databases } from "@/services/appwrite";
import { Query } from "appwrite";
import DualCameraCapture from "@/components/Post/DualCameraCapture";
import PhotoPreview from "@/components/Post/PhotoPreview";
import PageWrapper from "@/components/UI/PageWrapper";

const PostPhotoPage = () => {
  const [step, setStep] = useState<"front" | "back" | "preview" | "dual">("front");
  const [photos, setPhotos] = useState<{ front: Blob | null; back: Blob | null }>({ front: null, back: null });
  const [dualSupported, setDualSupported] = useState<boolean | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const navigate = useNavigate();

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const postsColId = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID!;
  const notifsColId = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID!;

  useEffect(() => {
    const checkAccess = async () => {
      const session = await account.get();

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const postRes = await databases.listDocuments(dbId, postsColId, [
        Query.equal("userId", session.$id),
        Query.greaterThan("timestamp", today.toISOString()),
      ]);

      if (postRes.documents.length > 0) {
        navigate("/");
        return;
      }

      const notifRes = await databases.listDocuments(dbId, notifsColId, [
        Query.equal("year", now.getUTCFullYear()),
        Query.equal("month", now.getUTCMonth() + 1),
        Query.equal("day", now.getUTCDate()),
        Query.equal("type", "daily"),
      ]);

      const notif = notifRes.documents[0];
      const notifTime = notif ? new Date(notif.timestamp) : null;

      if (!notifTime || now.getTime() - notifTime.getTime() > 5 * 60 * 1000) {
        navigate("/");
        return;
      }

      const secondsLeft = Math.floor((5 * 60 * 1000 - (now.getTime() - notifTime.getTime())) / 1000);
      setCountdown(secondsLeft);
    };

    checkAccess();
  }, [navigate]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      navigate("/");
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => (prev ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  useEffect(() => {
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

  const handleRetake = () => {
    setPhotos({ front: null, back: null });
    setStep(dualSupported ? "dual" : "front");
  };

  return (
    <PageWrapper title="Post Your Moment">
      {countdown !== null && (
        <p
          className={`text-center text-5xl font-bold mb-4 ${
            countdown <= 10 ? "text-red-500 animate-pulse" : "text-white"
          }`}
        >
          {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
        </p>
      )}
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
