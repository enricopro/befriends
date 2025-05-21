self.addEventListener("push", function (event) {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error("Push data is not valid JSON", e);
  }

  self.registration.showNotification(data.title || "📸 Time to post!", {
    body: data.body || "Open BeFriends and post your daily photo!",
    icon: "/logo_icon.png",
  });
});
