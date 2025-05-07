const { Client, Databases } = require("node-appwrite");
const webpush = require("web-push");
const { Query } = require("node-appwrite");

module.exports = async ({ res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);
  const dbId = process.env.APPWRITE_DATABASE_ID;
  const notificationsCol = process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID;
  const subscriptionsCol = process.env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID;

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();

  try {
    // Step 1: Get today’s notification
    const list = await databases.listDocuments(dbId, notificationsCol, [
      Query.equal("year", year),
      Query.equal("month", month),
      Query.equal("day", day),
      Query.equal("type", "daily"),
    ]);
    
    if (!list.documents.length) {
      log("No notification scheduled today.");
      return res.send("No scheduled notification.");
    }

    const notification = list.documents[0];
    const notifyAt = new Date(notification.timestamp);
    const diffMs = notifyAt - now;

    log(`Notification scheduled for ${notifyAt}`);
    log(`Current time: ${now}`);
    log(`Difference: ${diffMs}ms`);

    if (diffMs < 0) {
      log("Notification already sent today — skipping.")
      return res.send("Notification already sent today — skipping.");
    }

    if (diffMs > 2 * 60 * 1000) {
      log("Too early — skipping.")
      return res.send("Too early — skipping.");
    }

    if (diffMs > 0) {
      log(`Waiting ${Math.floor(diffMs / 1000)}s until push...`);
      await new Promise((r) => setTimeout(r, diffMs));
    }

    // Step 2: Send to all subscribers
    const subs = await databases.listDocuments(dbId, subscriptionsCol);
    if (!subs.documents.length) {
      log("No subscribers found.");
      return res.send("No one to notify.");
    }

    // Configure web-push
    webpush.setVapidDetails(
      "mailto:hello@befriends.app",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    const payload = JSON.stringify({
      title: "📸 Time to post!",
      body: "Open BeFriends and post your daily photo!",
    });

    let count = 0;

    for (const sub of subs.documents) {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth,
        },
      };

      try {
        await webpush.sendNotification(pushSub, payload);
        count++;
      } catch (e) {
        error(`❌ Failed for ${sub.endpoint}:`, e.message);
      }
    }

    log(`✅ Sent push to ${count} user(s).`);
    return res.send(`Notification sent to ${count} users.`);
  } catch (err) {
    error("Fatal error:", err.message);
    return res.send("Failure", 500);
  }
};
