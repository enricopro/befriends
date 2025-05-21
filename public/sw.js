self.addEventListener("push", function (event) {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || "📸 Time to post!", {
    body: data.body || "Open BeFriends and post your daily photo!",
    icon: "/logo_icon.png",
  });
});