import { use, useState, useEffect } from "react";
import { account, databases } from "@/services/appwrite";
import { ID } from "appwrite";
import { useNavigate } from "react-router-dom";
import PageWrapper from "@/components/UI/PageWrapper";

const RegisterPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
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

  const handleRegister = async () => {
    setError("");

    try {
      console.log("🔵 Creating user...");
      await account.create(ID.unique(), email, password, username);

      console.log("🔵 Creating session...");
      await account.createEmailPasswordSession(email, password);

      console.log("🔵 Getting user...");
      const sessionUser = await account.get();
      console.log("✅ Got user:", sessionUser.$id);

      console.log("🔵 Creating user document...");
      await databases.createDocument(
        import.meta.env.VITE_APPWRITE_DATABASE_ID!,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID!,
        sessionUser.$id,
        {
          username,
          friends: [],
        }
      );
      console.log("✅ User document created");

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

        console.log("✅ Subscribed to push:", subscription);

        const subData = subscription.toJSON();

        await databases.createDocument(
          import.meta.env.VITE_APPWRITE_DATABASE_ID!,
          import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!,
          sessionUser.$id,
          {
            userId: sessionUser.$id,
            endpoint: subData.endpoint,
            keys_auth: subData.keys.auth,
            keys_p256dh: subData.keys.p256dh,
          }
        );

        console.log("✅ Subscription document saved");
      } else {
        console.warn("⚠️ Notification permission denied or unsupported");
      }

      console.log("✅ Redirecting to /");
      navigate("/");
    } catch (err: any) {
      console.error("❌ Registration error:", err);
      setError(err.message || "Registration failed");
    }
  };

  return (
    <PageWrapper title="Register">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-600"
        />
        <button
          onClick={handleRegister}
          className="w-full bg-white text-black p-2 rounded hover:bg-zinc-200"
        >
          Register
        </button>
        {error && <p className="text-red-400 text-sm">{error}</p>}
      </div>
    </PageWrapper>
  );
};

export default RegisterPage;
