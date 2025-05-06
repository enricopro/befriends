type Props = {
  user: {
    $id: string;
    username: string;
    description?: string;
    profilePicId?: string;
  };
  action?: React.ReactNode;
};

import { storage } from "@/services/appwrite";
import { useEffect, useState } from "react";

const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_ID!;

const UserListItem = ({ user, action }: Props) => {
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user.profilePicId) {
      const url = storage.getFileDownload(bucketId, user.profilePicId).href;
      setProfileUrl(url);
    }
  }, [user.profilePicId]);

  return (
    <div className="flex items-center justify-between bg-zinc-900 rounded-lg px-4 py-3">
      <div className="flex items-center gap-3">
        {profileUrl ? (
          <img src={profileUrl} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-700" />
        )}
        <div>
          <p className="font-semibold">{user.username}</p>
          {user.description && (
            <p className="text-sm text-zinc-400 line-clamp-1">{user.description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default UserListItem;
