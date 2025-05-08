// full updated HomePage with location below profile name and loading state to prevent flash
import { useEffect, useState } from "react";
import { account, databases, storage } from "@/services/appwrite";
import { Query } from "appwrite";
import PageWrapper from "@/components/UI/PageWrapper";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const [userId, setUserId] = useState("");
  const [posts, setPosts] = useState<any[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [swappedPostIds, setSwappedPostIds] = useState<Set<string>>(new Set());
  const [emojiPickerVisible, setEmojiPickerVisible] = useState<Record<string, boolean>>({});
  const [canViewFeed, setCanViewFeed] = useState(false);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!;
  const postsColId = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID!;
  const notifsColId = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID!;
  const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_ID!;
  const openCageKey = import.meta.env.VITE_OPENCAGE_API_KEY;

  const emojis = ["👍", "😁", "😮", "😍", "😂"];

  useEffect(() => {
    const loadData = async () => {
      const session = await account.get();
      setUserId(session.$id);

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);

      const postRes = await databases.listDocuments(dbId, postsColId, [
        Query.equal("userId", session.$id),
        Query.greaterThan("timestamp", today.toISOString()),
      ]);

      const hasPosted = postRes.documents.length > 0;
      setCanViewFeed(hasPosted);

      const notifRes = await databases.listDocuments(dbId, notifsColId, [
        Query.equal("year", now.getUTCFullYear()),
        Query.equal("month", now.getUTCMonth() + 1),
        Query.equal("day", now.getUTCDate()),
        Query.equal("type", "daily"),
      ]);

      const notif = notifRes.documents[0];
      const notifTime = notif ? new Date(notif.timestamp) : null;

      if (notifTime && now.getTime() - notifTime.getTime() < 5 * 60 * 1000 && now.getTime() - notifTime.getTime() > 0 && !hasPosted) {
        navigate("/post");
        return;
      }

      if (!hasPosted) {
        setLoading(false);
        return;
      }

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

      const locMap: Record<string, string> = {};
      await Promise.all(filteredPosts.map(async (post) => {
        if (post.lat && post.lng) {
          const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${post.lat}+${post.lng}&key=${openCageKey}`);
          const data = await res.json();
          locMap[post.$id] = data?.results?.[0]?.components?.city || data?.results?.[0]?.components?.country || "";
        }
      }));
      setLocations(locMap);
      setLoading(false);
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

  const userPost = posts.find((p) => p.userId === userId);
  const friendsPosts = posts.filter((p) => p.userId !== userId);

  return (
    <PageWrapper title="Today's Posts">
      {loading ? (
        <div className="flex justify-center items-center h-40 text-zinc-400 animate-pulse">
          <span>Loading...</span>
        </div>
      ) : !canViewFeed ? (
        <div className="flex flex-col items-center text-center text-zinc-400 space-y-4">
          <img src="/missed_image.png" alt="Missed" className="w-52 h-auto" />
          <p>You missed the posting window. Come back tomorrow!</p>
        </div>
      ) : (
        <div className="space-y-6">

        {/* USER POST - Mini Preview */}
        {userPost && (
          <div className="bg-black rounded-xl overflow-hidden border border-0 shadow-md w-1/3 mx-auto">
            <div className="relative">
              <img
                src={getPhotoUrl(swappedPostIds.has(userPost.$id) ? userPost.frontPhotoId : userPost.backPhotoId)}
                alt="User Main"
                className="w-full h-auto object-cover rounded-lg"
              />
              <img
                src={getPhotoUrl(swappedPostIds.has(userPost.$id) ? userPost.backPhotoId : userPost.frontPhotoId)}
                alt="User PiP"
                onClick={() => toggleSwap(userPost.$id)}
                className="absolute top-2 left-2 w-12 h-16 object-cover rounded-md border-2 border-white shadow cursor-pointer"
              />
            </div>

            {userPost.description && (
              <div className="px-2 pt-2 text-xs text-white">
                {userPost.description}
              </div>
            )}

            {/* Reactions for user post */}
            {Object.keys(getReactionSummary(userPost.reactions || {})).length > 0 && (
              <div className="px-2 pt-2 text-xs text-white flex gap-2 flex-wrap break-words">
                {Object.entries(getReactionSummary(userPost.reactions || [])).map(([emoji, count]) => (
                  <span key={emoji}>{emoji} {count}</span>
                ))}
              </div>
            )}

            <div className="px-2 pt-1 pb-2 flex justify-start items-center text-white text-xs border-t border-black whitespace-nowrap overflow-hidden text-ellipsis">
              <Link
                to={`/post/${userPost.$id}`}
                onClick={() => sessionStorage.setItem("scrollPosition", window.scrollY.toString())}
                className="flex items-center gap-1 text-zinc-400 hover:text-white"
              >
                {userPost.comments?.length ? `${userPost.comments.length} comments` : "Add a comment..."}
              </Link>
            </div>
          </div>
        )}

        {/* FRIENDS POSTS - Full Size */}
        {friendsPosts.map((post) => {
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
            ? `${post.comments.length} comments`
            : "";
          const location = locations[post.$id];

          return (
            <div
              key={post.$id}
              className="bg-black rounded-xl overflow-hidden shadow-xl"
            >
              <div className="flex items-center gap-3 p-3 px-0.5">
                {profileUrl ? (
                  <img
                    src={profileUrl}
                    alt="Profile"
                    className="w-8 h-8 object-cover rounded-full border border-white"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-zinc-700" />
                )}
                <div className="text-white text-sm">
                  <p className="font-semibold">{post.username}</p>
                  <p className="text-xs text-zinc-400">
                    {new Date(post.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })} {location && `• ${location}`}
                  </p>
                </div>
              </div>

              <div className="relative">
                <img
                  src={getPhotoUrl(mainPhotoId)}
                  alt="Main"
                  className="w-full h-auto object-cover rounded-lg"
                />
                <img
                  src={getPhotoUrl(pipPhotoId)}
                  alt="PiP"
                  onClick={() => toggleSwap(post.$id)}
                  className="absolute top-3 left-3 w-20 h-28 object-cover rounded-lg border-2 border-white shadow-md cursor-pointer"
                />

                {Object.entries(summary).length > 0 && (
                  <div className="absolute bottom-2 left-3 bg-black bg-opacity-60 text-white text-sm px-2 py-1 rounded-lg shadow">
                    {Object.entries(summary).map(([emoji, count]) => (
                      <span key={emoji} className="mr-2">{emoji} {count}</span>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-2 right-3">
                  <button
                    onClick={() => toggleEmojiPicker(post.$id)}
                    className="bg-black bg-opacity-60 text-white w-10 h-10 flex items-center justify-center rounded-full border border-white shadow hover:scale-105 transition"
                  >
                    {userReaction || "+"}
                  </button>
                  {showPicker && (
                    <div className="absolute bottom-12 right-0 bg-zinc-900 border border-zinc-700 rounded-xl shadow-md p-2 flex gap-2 z-50 animate-fade-in-scale">
                      {emojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(post, emoji)}
                          className="text-xl hover:scale-110 transition"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {post.description && (
                <div className="px-0.5 pt-3 text-sm text-white">
                  {post.description}
                </div>
              )}

              <div className="px-0.5 py-3 pt-0 flex justify-start items-center border-t border-black text-white text-sm">
                <Link
                  to={`/post/${post.$id}`}
                  onClick={() => sessionStorage.setItem("scrollPosition", window.scrollY.toString())}
                  className="flex items-center gap-1 text-zinc-400 hover:text-white"
                >
                  <span>{commentLabel || "Add a comment..."}</span>
                </Link>
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
