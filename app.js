import { initStore } from "./src/state/store.js";
import { initTheme } from "./src/ui/theme.js";
import { initModals } from "./src/ui/modal.js";
import { renderApp } from "./src/ui/render.js";
import { initFirebaseApp } from "./src/services/firebase.service.js";
import { initAuth } from "./src/services/auth.service.js";
import { renderDashboard } from "./src/features/dashboard/dashboard.module.js";
import { initAtlasRuntime } from "./src/app.runtime.js";

document.addEventListener("DOMContentLoaded", async () => {
  initStore();
  initTheme();
  initModals();

  renderApp();
  renderDashboard();
  try {
    await initFirebaseApp();
    await initAuth();
  } catch (error) {
    console.warn("Firebase initialization skipped or failed:", error);
  }

  initAtlasRuntime();
});