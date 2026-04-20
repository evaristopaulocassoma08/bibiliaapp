import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted user preferences before render to avoid flash
const darkMode = localStorage.getItem("darkMode") !== "false";
document.documentElement.classList.toggle("light", !darkMode);

const fontSize = localStorage.getItem("fontSize") || "medium";
document.documentElement.style.fontSize =
  fontSize === "small" ? "14px" : fontSize === "large" ? "18px" : "16px";

if (window.location.hostname.includes("id-preview--") && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });

    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });
  });
}

// Capture PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  (window as any).__pwaInstallPrompt = e;
});

createRoot(document.getElementById("root")!).render(<App />);
