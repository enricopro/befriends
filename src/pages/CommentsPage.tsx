import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { account, databases, storage } from "@/services/appwrite";
import PageWrapper from "@/components/UI/PageWrapper";
import { ArrowLeft } from "lucide-react";
import { Query } from "appwrite";

const CommentsPage = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<any>(null);
  const [comment, setComment] = useState("");
  const [username, setUsername] = useState("");
  const [profileMap, setProfileMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [swapped, setSwapped] = useState(false);

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const postsColId = import.meta.env.VITE_APPWRITE_POSTS_COLLECTION_ID!;
  const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!;
  const bucketId = import.meta.env.VITE_APPWRITE_STORAGE_ID!;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = await account.get();
        const userDoc = await databases.getDocument(dbId, usersColId, session.$id);
        setUsername(userDoc.username);

        const doc = await databases.getDocument(dbId, postsColId, postId!);
        setPost(doc);

        const uniqueUsernames = Array.from(new Set((doc.comments || []).map((c: string) => c.split(":")[0])));
        const profiles = await Promise.all(uniqueUsernames.map(async (uname) => {
          const result = await databases.listDocuments(dbId, usersColId, [
            Query.equal("username", uname),
          ]);
          const user = result.documents[0];
          return user ? { [uname]: user.profilePicId } : {};
        }));

        const combined: Record<string, string> = Object.assign({}, ...profiles);
        setProfileMap(combined);
      } catch (err) {
        console.error("Error fetching post:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const newComment = `${username}: ${comment.trim()}`;
    const updatedComments = [...(post.comments || []), newComment];

    await databases.updateDocument(dbId, postsColId, postId!, {
      comments: updatedComments,
    });

    setPost((prev: any) => ({ ...prev, comments: updatedComments }));
    setComment("");
  };

  const getPhotoUrl = (id: string) => storage.getFileDownload(bucketId, id);

  if (loading) return <PageWrapper title="Comments"><p>Loading...</p></PageWrapper>;
  if (!post) return <PageWrapper title="Comments"><p>Post not found.</p></PageWrapper>;

  const mainPhotoId = swapped ? post.frontPhotoId : post.backPhotoId;
  const pipPhotoId = swapped ? post.backPhotoId : post.frontPhotoId;

  return (
    <PageWrapper>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <button onClick={() => navigate(-1)} className="text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-white">Comments</h1>
        </div>

        <div className="relative w-full max-w-md aspect-[3/4] rounded-xl overflow-hidden border border-zinc-700">
          <img
            src={getPhotoUrl(mainPhotoId)}
            alt="Main photo"
            className="w-full h-full object-cover"
          />
          <img
            src={getPhotoUrl(pipPhotoId)}
            alt="Preview thumbnail"
            onClick={() => setSwapped(!swapped)}
            className="absolute top-2 right-2 w-24 h-32 object-cover border-2 border-white rounded-xl shadow-md cursor-pointer"
          />
        </div>

        {post.description && <p className="text-white text-sm">{post.description}</p>}

        <div className="space-y-2">
          {(post.comments || []).map((c: string, idx: number) => {
            const [uname, ...rest] = c.split(": ");
            const content = rest.join(": ");
            const profileId = profileMap[uname];
            return (
              <div key={idx} className="flex items-start gap-3 border-b border-zinc-800 py-2">
                {profileId ? (
                  <img
                    src={getPhotoUrl(profileId)}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{uname}</p>
                  <p className="text-sm text-zinc-300">{content}</p>
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-2 mt-4">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-zinc-800 text-white p-2 rounded-xl border border-zinc-700"
            />
            <button
              onClick={handleAddComment}
              className="bg-white text-black px-3 py-2 rounded-xl hover:bg-zinc-200"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default CommentsPage;
