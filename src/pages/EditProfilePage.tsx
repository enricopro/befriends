import { useEffect, useState, useRef } from "react";
import { account, databases, storage, ID } from "@/services/appwrite";
import PageWrapper from "@/components/UI/PageWrapper";

const EditProfilePage = () => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [profilePicId, setProfilePicId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!;
  const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_ID!;

  useEffect(() => {
    const fetchUser = async () => {
      const sessionUser = await account.get();
      const userDoc = await databases.getDocument(databaseId, usersCollectionId, sessionUser.$id);
      setUserId(sessionUser.$id);
      setUsername(userDoc.username);
      setDescription(userDoc.description || "");
      if (userDoc.profilePicId) {
        setProfilePicId(userDoc.profilePicId);
        const file = storage.getFileDownload(bucketId, userDoc.profilePicId);
        setPreviewUrl(file);
      }
    };
    fetchUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setNewFile(file);
    if (file) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!userId) return;
    setMessage("Saving...");

    try {
      let uploadedPicId = profilePicId;

      if (newFile) {
        const uploaded = await storage.createFile(bucketId, ID.unique(), newFile);
        uploadedPicId = uploaded.$id;
      }

      await databases.updateDocument(databaseId, usersCollectionId, userId, {
        profilePicId: uploadedPicId,
        description,
      });

      setMessage("Profile updated!");
      setProfilePicId(uploadedPicId);
      setNewFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage("Failed to update profile.");
    }
  };

  return (
    <PageWrapper title="Edit Profile">
      <div className="flex flex-col items-center space-y-4 text-center w-full max-w-md">
        <p className="text-xl font-semibold">{username}</p>

        {previewUrl && (
          <img
            src={previewUrl}
            alt="Profile preview"
            className="w-32 h-32 object-cover rounded-full border border-white"
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-zinc-800 text-white border border-zinc-600 px-4 py-2 rounded hover:bg-zinc-700"
        >
          Choose Photo
        </button>

        <textarea
          placeholder="Write a short description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-zinc-800 text-white border border-zinc-600 p-2 rounded resize-none min-h-[80px]"
        />

        <button
          onClick={handleUpload}
          disabled={!newFile && description === ""}
          className="w-full bg-white text-black p-2 rounded hover:bg-zinc-200 disabled:opacity-30"
        >
          Save Changes
        </button>

        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </div>
    </PageWrapper>
  );
};

export default EditProfilePage;
