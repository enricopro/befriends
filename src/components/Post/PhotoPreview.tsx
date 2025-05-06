import { useEffect, useState } from "react";
import { ID, account, databases, storage } from "@/services/appwrite";
import { useNavigate } from "react-router-dom";

type Props = {
  frontPhoto: Blob;
  backPhoto: Blob;
  onRetake: () => void;
};

const PhotoPreview = ({ frontPhoto, backPhoto, onRetake }: Props) => {
  const [main, setMain] = useState<"front" | "back">("back");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Location access denied", err)
    );
  }, []);

  const handlePost = async () => {
    setLoading(true);
    setError("");

    try {
      const user = await account.get();

      const [frontFile, backFile] = await Promise.all([
        storage.createFile(
          import.meta.env.VITE_APPWRITE_STORAGE_ID!,
          ID.unique(),
          new File([frontPhoto], "front.jpg", { type: "image/jpeg" })
        ),
        storage.createFile(
          import.meta.env.VITE_APPWRITE_STORAGE_ID!,
          ID.unique(),
          new File([backPhoto], "back.jpg", { type: "image/jpeg" })
        ),
      ]);

      const userDoc = await databases.getDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID!,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!,
        user.$id
      );
      const username = userDoc.username || "anon";

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID!,
        import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID!,
        ID.unique(),
        {
          userId: user.$id,
          username,
          frontPhotoId: frontFile.$id,
          backPhotoId: backFile.$id,
          timestamp: new Date().toISOString(),
          lat: location?.lat ?? null,
          lng: location?.lng ?? null,
          reactions: [],
          comments: [],
          description,
        }
      );

      setSuccess(true);
      setTimeout(() => navigate("/"), 1500);
    } catch (err: any) {
      console.error("Post error:", err);
      setError(err.message || "Failed to post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const mainPhoto = main === "front" ? frontPhoto : backPhoto;
  const pipPhoto = main === "front" ? backPhoto : frontPhoto;

  return (
    <div className="space-y-4 relative">
      <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden border border-zinc-700">
        <img
          src={URL.createObjectURL(mainPhoto)}
          alt="Main photo"
          className="w-full h-full object-cover"
        />
        <img
          src={URL.createObjectURL(pipPhoto)}
          alt="Preview thumbnail"
          onClick={() => setMain(main === "front" ? "back" : "front")}
          className="absolute top-2 right-2 w-24 h-32 object-cover border-2 border-white rounded-xl shadow-md cursor-pointer"
        />
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Write a description..."
        className="w-full bg-zinc-800 text-white border border-zinc-600 p-2 rounded resize-none"
      />

      {success ? (
        <p className="text-green-400 text-center">Posted successfully! 🎉</p>
      ) : (
        <div className="flex gap-4">
          <button
            onClick={onRetake}
            className="flex-1 border border-white p-2 rounded hover:bg-zinc-700"
            disabled={loading}
          >
            Retake
          </button>
          <button
            onClick={handlePost}
            className="flex-1 bg-white text-black p-2 rounded hover:bg-zinc-200"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}
    </div>
  );
};

export default PhotoPreview;
