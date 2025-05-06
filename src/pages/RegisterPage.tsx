import { useState } from "react";
import { account, databases, ID } from "@/services/appwrite";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/components/UI/PageWrapper";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const user = await account.create(ID.unique(), email, password);

      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID!,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!,
        user.$id,
        {
          username,
          friends: [],
          pendingRequests: [],
        }
      );

      await account.createEmailPasswordSession(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    }
  };

  return (
    <PageWrapper title="Register">
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 p-2 rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full bg-zinc-800 text-white placeholder-zinc-400 border border-zinc-700 p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-white text-black font-semibold p-2 rounded hover:bg-zinc-200"
        >
          Create Account
        </button>
      </form>
    </PageWrapper>
  );
};

export default RegisterPage;
