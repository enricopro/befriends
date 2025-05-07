import { account, databases } from "@/services/appwrite";

export const subscribeToPush = async () => {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    alert("Push notifications not supported");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    alert("Permission not granted");
    return;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: vapidKey,
  });

  const session = await account.get();
  await databases.createDocument(
    import.meta.env.VITE_APPWRITE_DATABASE_ID!,
    import.meta.env.VITE_APPWRITE_SUBSCRIPTIONS_COLLECTION_ID!,
    session.$id,
    {
      userId: session.$id,
      endpoint: subscription.endpoint,
      keys_auth: subscription.keys.auth,
      keys_p256dh: subscription.keys.p256dh,
    }
  );

  alert("✅ Subscribed to notifications!");
};
