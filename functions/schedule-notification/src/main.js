const { Client, Databases, ID } = require("node-appwrite");
const { DateTime } = require("luxon");

module.exports = async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new Databases(client);

  const dbId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID;

  try {
    // Set time zone to Europe/Rome
    const romeNow = DateTime.now().setZone("Europe/Rome");

    // Get next day's date in Rome
    const nextDay = romeNow.plus({ days: 1 }).startOf("day");

    // Random hour between 9 and 22 (inclusive)
    const randomHour = 9 + Math.floor(Math.random() * 15);
    const randomMinute = Math.floor(Math.random() * 60);

    // Create the DateTime in Rome time zone, then convert to UTC
    const notifyAt = nextDay.set({
      hour: randomHour,
      minute: randomMinute,
      second: 0,
    });

    const notifyAtUTC = notifyAt.toUTC();

    await databases.createDocument(dbId, collectionId, ID.unique(), {
      timestamp: notifyAtUTC.toISO(), // Store as ISO UTC string
      year: notifyAtUTC.year,
      month: notifyAtUTC.month,
      day: notifyAtUTC.day,
      type: "daily",
    });

    log(`✅ Notification scheduled for ${notifyAtUTC.toISO()} (Rome time: ${notifyAt.toISO()})`);
    return res.send("Scheduled notification successfully.");
  } catch (err) {
    error("❌ Failed to schedule notification:", err);
    return res.send("Error occurred", 500);
  }
};
