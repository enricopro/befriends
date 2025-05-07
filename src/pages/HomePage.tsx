import { useEffect, useState } from "react";
import { account, databases, storage } from "@/services/appwrite";
import { Query } from "appwrite";
import PageWrapper from "@/components/UI/PageWrapper";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const [userId, setUserId] = useState("");
  const [friends, setFriends] = useState<string[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [swappedPostIds, setSwappedPostIds] = useState<Set<string>>(new Set());
  const [emojiPickerVisible, setEmojiPickerVisible] = useState<Record<string, boolean>>({});
  const [canViewFeed, setCanViewFeed] = useState(false);
  const navigate = useNavigate();

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!;
  const postsColId = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID!;
  const notifsColId = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID!;
  const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_ID!;

  const emojis = ["👍", "😁", "😮", "😍", "😂"];

  useEffect(() => {
    const loadData = async () => {
      const session = await account.get();
      setUserId(session.$id);

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      // Check if user has posted today
      const postRes = await databases.listDocuments(dbId, postsColId, [
        Query.equal("userId", session.$id),
        Query.greaterThan("timestamp", today.toISOString()),
      ]);

      const hasPosted = postRes.documents.length > 0;
      setCanViewFeed(hasPosted);

      // Fetch today's notification
      const notifRes = await databases.listDocuments(dbId, notifsColId, [
        Query.equal("year", now.getUTCFullYear()),
        Query.equal("month", now.getUTCMonth() + 1),
        Query.equal("day", now.getUTCDate()),
        Query.equal("type", "daily"),
      ]);

      const notif = notifRes.documents[0];
      const notifTime = notif ? new Date(notif.timestamp) : null;

      // If within 5 minutes of the notification AND user hasn't posted, redirect
      if (notifTime && now.getTime() - notifTime.getTime() < 5 * 60 * 1000 && !hasPosted) {
        navigate("/post");
        return;
      }

      if (!hasPosted) return;

      const userDoc = await databases.getDocument(dbId, usersColId, session.$id);
      const friendIds = userDoc.friends || [];
      const allowedUserIds = [session.$id, ...friendIds];

      const result = await databases.listDocuments(dbId, postsColId, [
        Query.greaterThan("timestamp", today.toISOString()),
      ]);

      const filteredPosts = result.documents.filter((doc) =>
        allowedUserIds.includes(doc.userId)
      );

      const userIds = Array.from(new Set(filteredPosts.map((p) => p.userId)));
      const userDocs = await Promise.all(userIds.map((id) =>
        databases.getDocument(dbId, usersColId, id).catch(() => null)
      ));
      const userDataMap: Record<string, any> = {};
      userDocs.forEach((user) => {
        if (user) userDataMap[user.$id] = user;
      });

      setUserMap(userDataMap);
      setPosts(filteredPosts);
    };

    loadData();
  }, []);

  useEffect(() => {
    const scrollY = sessionStorage.getItem("scrollPosition");
    if (scrollY && posts.length > 0) {
      window.scrollTo(0, parseInt(scrollY));
      sessionStorage.removeItem("scrollPosition");
    }
  }, [posts]);

  const getPhotoUrl = (fileId: string) => storage.getFileDownload(bucketId, fileId);

  const toggleSwap = (postId: string) => {
    setSwappedPostIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleReact = async (post: any, emoji: string) => {
    const oldReactions = post.reactions || [];
    const filtered = oldReactions.filter((r: string) => !r.endsWith(`:${userId}`));
    const updatedReactions = [...filtered, `${emoji}:${userId}`];

    await databases.updateDocument(dbId, postsColId, post.$id, {
      reactions: updatedReactions,
    });

    setPosts((prev) =>
      prev.map((p) =>
        p.$id === post.$id ? { ...p, reactions: updatedReactions } : p
      )
    );
    setEmojiPickerVisible((prev) => ({ ...prev, [post.$id]: false }));
  };

  const getReactionSummary = (reactions: string[] = []) => {
    const summary: Record<string, number> = {};
    for (const r of reactions) {
      const [emoji] = r.split(":");
      summary[emoji] = (summary[emoji] || 0) + 1;
    }
    return summary;
  };

  const getUserReaction = (reactions: string[] = []) => {
    const reaction = reactions.find((r) => r.endsWith(`:${userId}`));
    return reaction ? reaction.split(":")[0] : null;
  };

  const toggleEmojiPicker = (postId: string) => {
    setEmojiPickerVisible((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <PageWrapper title="Today's Posts">
      {!canViewFeed ? (
        <div className="flex flex-col items-center text-center text-zinc-400 space-y-4">
          <img src="/missed_image.png" alt="Missed" className="w-52 h-auto" />
          <p>You missed the posting window. Come back tomorrow!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isSwapped = swappedPostIds.has(post.$id);
            const mainPhotoId = isSwapped ? post.frontPhotoId : post.backPhotoId;
            const pipPhotoId = isSwapped ? post.backPhotoId : post.frontPhotoId;
            const user = userMap[post.userId];
            const profileUrl = user?.profilePicId ? getPhotoUrl(user.profilePicId) : null;
            const reactions = post.reactions || [];
            const userReaction = getUserReaction(reactions);
            const summary = getReactionSummary(reactions);
            const showPicker = emojiPickerVisible[post.$id];
            const commentLabel = post.comments?.length
              ? `${post.comments.length} comment${post.comments.length > 1 ? "s" : ""}`
              : "Add a comment...";

            return (
              <div
                key={post.$id}
                className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800"
              >
                <div className="flex items-center gap-3 p-3 border-b border-zinc-800">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt="Profile"
                      className="w-10 h-10 object-cover rounded-full border border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-700" />
                  )}
                  <div>
                    <p className="font-semibold">{post.username}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(post.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src={getPhotoUrl(mainPhotoId)}
                    alt="Main"
                    className="w-full object-contain max-h-[600px]"
                  />
                  <img
                    src={getPhotoUrl(pipPhotoId)}
                    alt="PiP"
                    onClick={() => toggleSwap(post.$id)}
                    className="absolute top-2 right-2 w-24 h-auto max-h-40 object-contain rounded-lg border-2 border-white cursor-pointer"
                  />
                </div>
                {post.description && (
                  <div className="p-3 border-t border-zinc-800">
                    <p className="text-sm text-zinc-200">{post.description}</p>
                  </div>
                )}
                <div className="p-3 border-t border-zinc-800 space-y-2">
                  {Object.keys(summary).length > 0 && (
                    <div className="flex gap-2 text-lg">
                      {Object.entries(summary).map(([emoji, count]) => (
                        <span key={emoji}>
                          {emoji} {count}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {userReaction && !showPicker ? (
                        <button onClick={() => toggleEmojiPicker(post.$id)} className="text-xl">
                          {userReaction}
                        </button>
                      ) : (
                        emojis.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReact(post, emoji)}
                            className="text-xl hover:scale-110 transition"
                          >
                            {emoji}
                          </button>
                        ))
                      )}
                    </div>
                    <Link
                      to={`/post/${post.$id}`}
                      onClick={() => sessionStorage.setItem("scrollPosition", window.scrollY.toString())}
                      className="text-sm text-zinc-400 underline hover:text-white"
                    >
                      💬 {commentLabel}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
};

export default HomePage;
