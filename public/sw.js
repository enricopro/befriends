self.addEventListener("push", function (event) {
  const data = event.data?.json() || {};

  event.waitUntil( // 🔁 This keeps the SW alive
    self.registration.showNotification(data.title || "📸 Time to post!", {
      body: data.body || "Open BeFriends and post your daily photo!",
      icon: "/logo_icon.png",
      data: {
        url: data.data?.url || "https://befriends-jet.vercel.app/post"
      }
    })
  );
});
