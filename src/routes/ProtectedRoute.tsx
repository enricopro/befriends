import { useEffect, useState } from "react";
import { account } from "@/services/appwrite";
import { useNavigate } from "react-router-dom";
import { JSX } from "react/jsx-runtime";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        await account.get();
        setIsLoggedIn(true);
      } catch {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return <p className="p-4">Loading...</p>;

  return isLoggedIn ? children : null;
};

export default ProtectedRoute;
