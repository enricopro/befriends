import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

const updateSW = registerSW({
  // Do not auto-check for updates on load
  immediate: false,
  onNeedRefresh() {
    // no-op: we'll never see the default banner
    console.log("⚡️ SW update available");
  },
  onOfflineReady() {
    console.log("✅ App ready for offline use");
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="bg-black text-white min-h-screen">
        <App />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);
