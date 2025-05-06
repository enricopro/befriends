import { Routes, Route, Navigate } from "react-router-dom";
import RegisterPage from "@/pages/RegisterPage";
import LoginPage from "@/pages/LoginPage";
import HomePage from "@/pages/HomePage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import PostPhotoPage from "@/pages/PostPhotoPage";
import EditProfilePage from "@/pages/EditProfilePage";
import FriendsPage from "@/pages/FriendsPage";
import CommentsPage from "@/pages/CommentsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/post" element={<ProtectedRoute><PostPhotoPage /></ProtectedRoute>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProtectedRoute><EditProfilePage /></ProtectedRoute>} />
      <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
      <Route path="/post/:postId" element={<CommentsPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
