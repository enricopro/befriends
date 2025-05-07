import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { account } from "@/services/appwrite";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  const handleLogout = async () => {
    await account.deleteSession("current");
    navigate("/login");
  };

  return (
    <header className="relative w-full py-4 border-b border-zinc-800 flex items-center justify-center">
      {/* Left icon (Logout) */}
      {!isAuthPage && (
        <button
          onClick={handleLogout}
          aria-label="Logout"
          className="absolute left-4"
        >
          <LogOut className="text-white w-5 h-5" />
        </button>
      )}

      {/* Center logo */}
      <Link to="/">
        <img
          src="/logo.png"
          alt="BeFriends Logo"
          className="h-8 mx-auto"
        />
      </Link>

      {/* Right icon (Profile) */}
      {!isAuthPage && (
        <Link to="/profile" aria-label="Profile" className="absolute right-4">
          <User className="text-white w-5 h-5" />
        </Link>
      )}
    </header>
  );
};

export default Header;
