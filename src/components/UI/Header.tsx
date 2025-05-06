import { Link, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { account } from "@/services/appwrite";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await account.deleteSession("current");
    navigate("/login");
  };

  return (
    <header className="w-full py-4 border-b border-zinc-800 flex items-center justify-between px-4">
      <button onClick={handleLogout} aria-label="Logout">
        <LogOut className="text-white w-5 h-5" />
      </button>

      <Link to="/">
        <img src="/logo.png" alt="BeFriends Logo" className="h-8" />
      </Link>

      <Link to="/profile" aria-label="Profile">
        <User className="text-white w-5 h-5" />
      </Link>
    </header>
  );
};

export default Header;
