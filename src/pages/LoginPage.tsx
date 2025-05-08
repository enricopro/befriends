import { useState, useEffect } from "react";
import { account, databases } from "@/services/appwrite";
import { useNavigate, Link } from "react-router-dom";
import PageWrapper from "@/components/UI/PageWrapper";
import { ID, Query } from "appwrite";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }  

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isInStandaloneMode =
      (window.matchMedia?.('(display-mode: standalone)').matches) ||
      ('standalone' in window.navigator && window.navigator.standalone);
  
    if (isIOS && isSafari && !isInStandaloneMode) {
      alert("To receive notifications, please add this app to your home screen.");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await account.createEmailPasswordSession(email, password);
      navigate("/");
    } catch (err: any) {
      setError("Invalid credentials");
    }

    try {
      console.log("🔵 Requesting notification permission...");
      const permission = await Notification.requestPermission();
    
      if (permission === "granted" && "serviceWorker" in navigator) {
        console.log("🔵 Waiting for active service worker...");
        const registration = await navigator.serviceWorker.ready;
    
        const vapidKey = urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY);
        console.log("🔵 Subscribing to push...");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey,
        });
    
        const subData = subscription.toJSON();

        console.log("✅ Subscribed:", subscription);
    
        console.log("🔍 Checking for existing subscription by endpoint...");
        const existingSubs = await databases.listDocuments(
          import.meta.env.VITE_APPWRITE_DATABASE_ID!,
          import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!,
          [Query.equal("endpoint", subscription.endpoint)]
        );
    
        if (existingSubs.total === 0) {
          console.log("➕ Creating new subscription...");
          const user = await account.get();
          await databases.createDocument(
            import.meta.env.VITE_APPWRITE_DATABASE_ID!,
            import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!,
            ID.unique(),
            {
              userId: user.$id,
              endpoint: subData.endpoint,
              keys_auth: subData.keys.auth,
              keys_p256dh: subData.keys.p256dh,
            }
          );
          console.log("✅ Subscription created successfully.");
        } else {
          console.log("✔️ Subscription already exists for this device.");
        }
      } else {
        console.warn("⚠️ Notification permission denied or unsupported.");
      }
    } catch (err) {
      console.error("❌ Push subscription on login failed:", err);
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
