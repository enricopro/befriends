import { useState } from "react";
import { account } from "@/services/appwrite";
import { useNavigate, Link } from "react-router-dom";
import PageWrapper from "@/components/UI/PageWrapper";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await account.createEmailPasswordSession(email, password);
      navigate("/");
    } catch (err: any) {
      setError("Invalid credentials");
    }
  };

  return (
    <PageWrapper title="Log In">
      <form onSubmit={handleLogin} className="space-y-4">
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
          Log In
        </button>
        <p className="text-sm text-center text-zinc-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-400 underline">
            Register
          </Link>
        </p>
      </form>
    </PageWrapper>
  );
};

export default LoginPage;
