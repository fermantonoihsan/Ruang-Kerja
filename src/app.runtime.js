import { columns } from "./config/constants.js";
import {
  clearFirebaseConfig,
  getFirebaseConfig,
  saveFirebaseConfig,
} from "./config/firebase.config.js";
import { renderDashboard } from "./features/dashboard/dashboard.render.js";
import { renderKanban } from "./features/kanban/kanban.render.js";
import { renderEditor } from "./features/notes/notes.render.js";
import { renderReminders } from "./features/reminders/reminders.render.js";
import {
  getCurrentUser,
  onAuthStateChanged,
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
} from "./services/auth.service.js";
import {
  initCloudSync,
  stopCloudSync,
} from "./services/cloud-sync.service.js";
import { initFirebase } from "./services/firebase.service.js";
import { registerServiceWorker } from "./services/pwa.service.js";
import {
  getDueReminders,
  showReminderNotification,
} from "./services/reminder.service.js";
import {
  getState,
  initStore,
  replaceState,
  saveState,
  selectedPage,
} from "./state/store.js";
import { bindEvents } from "./ui/events.js";
import { renderSidebar } from "./ui/sidebar.render.js";
import { initTheme } from "./ui/theme.js";
import { renderUser } from "./ui/user.render.js";
import { generateId, getTodayISO, parseTags } from "./utils/helpers.js";

const $ = (id) => document.getElementById(id);

let state = null;
let activeView = "dashboard";
let searchQuery = "";
let currentUser = null;
let syncStatus = "local";
let unsubscribeAuth = null;
let reminderTimer = null;
let checkingReminders = false;

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function filteredPages() {
  const q = searchQuery.toLowerCase();

  return (state.pages || []).filter((page) => {
    const text = `${page.title} ${page.markdown} ${(page.tags || []).join(" ")}`.toLowerCase();
    return !q || text.includes(q);
  });
}

function setView(view) {
  activeView = view;

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  [
    ["dashboard", $("dashboardView")],
    ["notes", $("notesView")],
    ["kanban", $("kanbanView")],
    ["reminders", $("remindersView")],
  ].forEach(([name, node]) => {
    if (node) node.classList.toggle("active", name === view);
  });
}

function selectPage(pageId) {
  const pageExists = state.pages.some((page) => page.id === pageId);
  if (!pageExists) return;

  state.selectedPageId = pageId;
  saveState();
  setView("notes");
  renderAll();
}

function createPage() {
  const title = $("newPageTitle")?.value?.trim() || "Untitled";

  const page = {
    id: generateId("page"),
    title,
    icon: title.slice(0, 1).toUpperCase(),
    status: $("newPageStatus")?.value || "ideas",
    tags: parseTags($("newPageTags")?.value || ""),
    markdown: `# ${title}\n\nStart writing your notes here.`,
    reminderAt: "",
    reminderDone: false,
    createdAt: getTodayISO(),
    updatedAt: getTodayISO(),
  };

  state.pages.push(page);
  state.selectedPageId = page.id;
  saveState();

  $("pageForm")?.reset();
  $("pageDialog")?.close();

  activeView = "notes";
  renderAll();
}

function renderAll() {
  state = getState();
  const pages = filteredPages();

  setView(activeView);
  renderSidebar({ state, pages, onSelectPage: selectPage });
  renderDashboard({ state, filteredPages: pages, setView, renderAll });
  renderEditor({ page: selectedPage() });
  renderKanban({ pages, columns, onOpenPage: selectPage });
  renderReminders({ pages });
  renderUser({ user: currentUser, syncStatus });
  refreshIcons();
}

async function checkDueReminders() {
  if (checkingReminders) return;

  checkingReminders = true;

  try {
    const currentState = getState();
    const dueReminders = getDueReminders(currentState.pages || []);
    if (!dueReminders.length) return;

    let didCompleteReminder = false;

    for (const page of dueReminders) {
      const didNotify = await showReminderNotification(page);
      if (!didNotify) continue;

      page.reminderDone = true;
      page.updatedAt = getTodayISO();
      didCompleteReminder = true;
    }

    if (didCompleteReminder) {
      saveState();
      renderAll();
    }
  } finally {
    checkingReminders = false;
  }
}

function startReminderScheduler() {
  clearInterval(reminderTimer);

  void checkDueReminders();
  reminderTimer = setInterval(() => {
    void checkDueReminders();
  }, 15_000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      void checkDueReminders();
    }
  });
}

function populateStatusOptions() {
  const options = columns.map((column) => `<option value="${column.id}">${column.title}</option>`).join("");

  if ($("statusSelect")) $("statusSelect").innerHTML = options;
  if ($("newPageStatus")) $("newPageStatus").innerHTML = options;
}

function setUserSession(user) {
  currentUser = user;
  renderAll();
}

function setSyncStatus(status) {
  syncStatus = status;
  renderAll();
}

function initializeFirebaseRuntime(config = getFirebaseConfig()) {
  const result = initFirebase(config);

  if (!result.ok) {
    stopCloudSync();
    setUserSession(null);
    setSyncStatus("local");
    return result;
  }

  setSyncStatus("login-required");
  observeAuthState();
  return result;
}

function observeAuthState() {
  unsubscribeAuth?.();

  unsubscribeAuth = onAuthStateChanged((user) => {
    setUserSession(user);

    if (user) {
      initCloudSync({
        getState,
        replaceState,
        saveLocalState: saveState,
        renderAll,
        setUserSession,
        setSyncStatus,
      });
      return;
    }

    stopCloudSync();
    setSyncStatus("login-required");
  });
}

export function initAtlasRuntime() {
  state = initStore();

  initTheme();
  initializeFirebaseRuntime();
  populateStatusOptions();
  bindEvents({
    state,
    getState,
    setView,
    renderAll,
    createPage,
    selectedPage,
    saveState,
    getCurrentUser,
    signInWithEmail,
    signUpWithEmail,
    signOutUser,
    getFirebaseConfig,
    saveFirebaseConfig,
    clearFirebaseConfig,
    onFirebaseConfigChange(config) {
      initializeFirebaseRuntime(config);
    },
    setSyncStatus,
    onReminderPermissionChange(permission) {
      if (permission === "granted") {
        void checkDueReminders();
      }
    },
    onSearchChange(query) {
      searchQuery = query;
      renderAll();
    },
  });
  renderAll();
  registerServiceWorker();
  startReminderScheduler();
}
