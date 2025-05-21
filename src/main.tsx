import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { registerSW } from "virtual:pwa-register";

registerSW({
  onNeedRefresh() {
    // Suppress the default prompt
    console.log("🔁 New content available");
  },
  onOfflineReady() {
    console.log("✅ Offline ready");
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
