import { useEffect, useState } from "react";
import { account, databases } from "@/services/appwrite";
import { Query } from "appwrite";
import PageWrapper from "@/components/UI/PageWrapper";
import UserListItem from "@/components/UserListItem";

const FriendsPage = () => {
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("");
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);

  const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID!;
  const usersColId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!;

  useEffect(() => {
    const fetchUser = async () => {
      const current = await account.get();
      const userDoc = await databases.getDocument(dbId, usersColId, current.$id);
      setUserId(current.$id);
      setUsername(userDoc.username);
      setSentRequests(userDoc.sentRequests || []);

      const friendIds = userDoc.friends || [];
      const pendingIds = userDoc.pendingRequests || [];

      const friendsData = await Promise.all(friendIds.map((id: string) =>
        databases.getDocument(dbId, usersColId, id).catch(() => null)
      ));
      const pendingData = await Promise.all(pendingIds.map((id: string) =>
        databases.getDocument(dbId, usersColId, id).catch(() => null)
      ));

      setFriends(friendsData.filter(Boolean));
      setPendingRequests(pendingData.filter(Boolean));
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchTerm]);

  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timeout);
  }, [message]);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const res = await databases.listDocuments(dbId, usersColId, [
        Query.contains("username", searchTerm),
        Query.notEqual("username", username),
      ]);

      const friendIds = new Set(friends.map((f) => f.$id));
      const filtered = res.documents.filter((user) => !friendIds.has(user.$id));
      setSearchResults(filtered);
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetId: string) => {
    const userDoc = await databases.getDocument(dbId, usersColId, userId);
    const targetDoc = await databases.getDocument(dbId, usersColId, targetId);

    await databases.updateDocument(dbId, usersColId, userId, {
      sentRequests: [...(userDoc.sentRequests || []), targetId],
    });

    await databases.updateDocument(dbId, usersColId, targetId, {
      pendingRequests: [...(targetDoc.pendingRequests || []), userId],
    });

    setSentRequests((prev) => [...prev, targetId]);
    setMessage("Friend request sent!");
  };

  const handleCancelRequest = async (targetId: string) => {
    const userDoc = await databases.getDocument(dbId, usersColId, userId);
    const targetDoc = await databases.getDocument(dbId, usersColId, targetId);

    await databases.updateDocument(dbId, usersColId, userId, {
      sentRequests: (userDoc.sentRequests || []).filter((id: string) => id !== targetId),
    });

    await databases.updateDocument(dbId, usersColId, targetId, {
      pendingRequests: (targetDoc.pendingRequests || []).filter((id: string) => id !== userId),
    });

    setSentRequests((prev) => prev.filter((id) => id !== targetId));
    setMessage("Request cancelled.");
  };

  const handleUnfriend = async (targetId: string) => {
    const userDoc = await databases.getDocument(dbId, usersColId, userId);
    const targetDoc = await databases.getDocument(dbId, usersColId, targetId);

    await databases.updateDocument(dbId, usersColId, userId, {
      friends: (userDoc.friends || []).filter((id: string) => id !== targetId),
    });

    await databases.updateDocument(dbId, usersColId, targetId, {
      friends: (targetDoc.friends || []).filter((id: string) => id !== userId),
    });

    setFriends((prev) => prev.filter((u) => u.$id !== targetId));
    setMessage("Unfriended.");
  };

  const handleAcceptRequest = async (fromId: string) => {
    const userDoc = await databases.getDocument(dbId, usersColId, userId);
    const senderDoc = await databases.getDocument(dbId, usersColId, fromId);

    const updatedFriends = [...(userDoc.friends || []), fromId];
    const updatedPending = (userDoc.pendingRequests || []).filter((id) => id !== fromId);
    const updatedSenderFriends = [...(senderDoc.friends || []), userId];
    const updatedSenderSent = (senderDoc.sentRequests || []).filter((id) => id !== userId);

    await databases.updateDocument(dbId, usersColId, userId, {
      friends: updatedFriends,
      pendingRequests: updatedPending,
    });

    await databases.updateDocument(dbId, usersColId, fromId, {
      friends: updatedSenderFriends,
      sentRequests: updatedSenderSent,
    });

    setFriends([...friends, senderDoc]);
    setPendingRequests(pendingRequests.filter((u) => u.$id !== fromId));
    setMessage("Friend added!");
  };

  return (
    <PageWrapper title="Friends">
      <div className="space-y-6">
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Search by username"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-800 text-white border border-zinc-600 p-2 mb-4 rounded"
          />

          {searchTerm.length >= 2 && (
            <div className="space-y-2">
              {searching ? (
                <p className="text-sm text-zinc-400">Searching...</p>
              ) : searchResults.length === 0 ? (
                <p className="text-sm text-zinc-400">No results found.</p>
              ) : (
                searchResults.map((user) => (
                  <UserListItem
                    key={user.$id}
                    user={user}
                    action={
                      friends.some((f) => f.$id === user.$id) ? (
                        <span className="text-green-400 text-sm">Friend</span>
                      ) : sentRequests.includes(user.$id) ? (
                        <button
                          onClick={() => handleCancelRequest(user.$id)}
                          className="text-sm px-3 py-1 border border-white rounded hover:bg-white hover:text-black"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(user.$id)}
                          className="text-sm px-3 py-1 border border-white rounded hover:bg-white hover:text-black"
                        >
                          Add
                        </button>
                      )
                    }
                  />
                ))
              )}
            </div>
          )}
        </div>

        {pendingRequests.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Incoming Requests</h2>
            {pendingRequests.map((user) => (
              <UserListItem
                key={user.$id}
                user={user}
                action={
                  <button
                    onClick={() => handleAcceptRequest(user.$id)}
                    className="text-sm px-3 py-1 border border-white rounded hover:bg-white hover:text-black"
                  >
                    Accept
                  </button>
                }
              />
            ))}
          </div>
        )}

        {friends.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Your Friends</h2>
            {friends.map((user) => (
              <UserListItem
                key={user.$id}
                user={user}
                action={
                  <button
                    onClick={() => handleUnfriend(user.$id)}
                    className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-500 hover:text-white"
                  >
                    Unfriend
                  </button>
                }
              />
            ))}
          </div>
        )}

        {message && <p className="text-sm text-zinc-400 text-center">{message}</p>}
      </div>
    </PageWrapper>
  );
};

export default FriendsPage;
