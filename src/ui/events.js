import { generateId, getTodayISO, parseTags } from "../utils/helpers.js";
import { toggleTheme } from "./theme.js";

const $ = (id) => document.getElementById(id);

function openDialog(dialogId) {
  const dialog = $(dialogId);
  if (!dialog) return;

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

export function bindEvents({
  state,
  getState,
  setView,
  renderAll,
  createPage,
  selectedPage,
  saveState,
  onSearchChange,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  setSyncStatus,
  onReminderPermissionChange,
}) {
  let isRegisterMode = false;

  $("sidebarToggle")?.addEventListener("click", () => {
    $("sidebar")?.classList.toggle("open");
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
      renderAll();
    });
  });

  document.addEventListener("click", (event) => {
    const dashboardPageButton = event.target.closest("[data-dashboard-page]");

    if (!dashboardPageButton) return;

    const pageId = dashboardPageButton.dataset.dashboardPage;
    const currentState = getState?.() || state;
    const pageExists = currentState.pages.some((page) => page.id === pageId);

    if (!pageExists) return;

    currentState.selectedPageId = pageId;
    saveState();
    setView("notes");
    renderAll();
  });

  $("searchInput")?.addEventListener("input", (event) => {
    onSearchChange?.(event.target.value.trim());
  });

  $("heroNewPageButton")?.addEventListener("click", () => openDialog("pageDialog"));
  $("newPageButton")?.addEventListener("click", () => openDialog("pageDialog"));
  $("newCardButton")?.addEventListener("click", () => openDialog("pageDialog"));

  $("pageForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createPage();
  });

  $("titleInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.title = event.target.value || "Untitled";
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("iconInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.icon = event.target.value || "P";
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("tagsInput")?.addEventListener("change", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.tags = parseTags(event.target.value);
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("statusSelect")?.addEventListener("change", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.status = event.target.value;
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("markdownInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.markdown = event.target.value;
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("reminderInput")?.addEventListener("change", (event) => {
    const page = selectedPage();
    if (!page) return;

    page.reminderAt = event.target.value || "";
    page.reminderDone = false;
    page.updatedAt = getTodayISO();
    saveState();
    renderAll();
  });

  $("deletePageButton")?.addEventListener("click", () => {
    const currentState = getState?.() || state;
    const page = selectedPage();
    if (!page || !currentState.pages?.length) return;

    const shouldDelete = window.confirm(`Delete "${page.title || "Untitled"}"?`);
    if (!shouldDelete) return;

    currentState.pages = currentState.pages.filter((item) => item.id !== page.id);
    currentState.selectedPageId = currentState.pages[0]?.id || "";
    saveState();
    setView(currentState.pages.length ? "notes" : "dashboard");
    renderAll();
  });

  $("duplicatePageButton")?.addEventListener("click", () => {
    const currentState = getState?.() || state;
    const page = selectedPage();
    if (!page) return;

    const now = getTodayISO();
    const duplicate = {
      ...page,
      id: generateId("page"),
      title: `${page.title || "Untitled"} Copy`,
      createdAt: now,
      updatedAt: now,
    };

    const pageIndex = currentState.pages.findIndex((item) => item.id === page.id);
    currentState.pages.splice(pageIndex + 1, 0, duplicate);
    currentState.selectedPageId = duplicate.id;
    saveState();
    setView("notes");
    renderAll();
  });

  $("requestReminderPermission")?.addEventListener("click", async () => {
    const permission = await requestNotificationPermission();
    onReminderPermissionChange?.(permission);
  });

  $("notificationButton")?.addEventListener("click", async () => {
    const permission = await requestNotificationPermission();
    onReminderPermissionChange?.(permission);
  });

  $("clearTagFilter")?.addEventListener("click", () => {
    if ($("searchInput")) $("searchInput").value = "";
    onSearchChange?.("");
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(button.closest("dialog"));
    });
  });

  $("themeToggle")?.addEventListener("click", () => {
    toggleTheme();
  });

  $("authButton")?.addEventListener("click", async () => {
    if (getCurrentUser?.()) {
      await signOutUser?.();
      return;
    }

    setAuthMode(false);
    openDialog("authDialog");
  });

  $("toggleAuthMode")?.addEventListener("click", () => {
    setAuthMode(!isRegisterMode);
  });

  $("authForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $("authEmail")?.value?.trim() || "";
    const password = $("authPassword")?.value || "";
    const name = $("authName")?.value?.trim() || "";
    const submitButton = $("submitAuthButton");

    try {
      if (submitButton) submitButton.disabled = true;

      if (isRegisterMode) {
        await signUpWithEmail?.(name, email, password);
      } else {
        await signInWithEmail?.(email, password);
      }

      $("authForm")?.reset();
      closeDialog($("authDialog"));
    } catch (error) {
      console.warn("[events] Auth request failed:", error);
      setSyncStatus?.("error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });

  $("settingsButton")?.addEventListener("click", () => {
    populateSettingsForm(getState?.() || state);
    openDialog("settingsDialog");
  });

  $("settingsForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const currentState = getState?.() || state;
    currentState.workspaceName = $("settingsWorkspaceName")?.value?.trim() || "My Workspace";
    currentState.displayName = $("settingsDisplayName")?.value?.trim() || "Guest";
    currentState.preferences = readSettingsPreferences();

    saveState();
    renderAll();
    closeDialog($("settingsDialog"));
  });

  $("settingsPageZoom")?.addEventListener("input", () => {
    updateZoomOutput();
  });

  $("resetViewPreferences")?.addEventListener("click", () => {
    const currentState = getState?.() || state;
    currentState.preferences = defaultPreferences();
    saveState();
    populateSettingsForm(currentState);
    renderAll();
  });

  function setAuthMode(nextIsRegisterMode) {
    isRegisterMode = nextIsRegisterMode;

    if ($("authTitle")) $("authTitle").textContent = isRegisterMode ? "Create Account" : "Login";
    if ($("authSubtitle")) {
      $("authSubtitle").textContent = isRegisterMode
        ? "Create an account to sync your workspace."
        : "Sign in to enable cloud sync.";
    }

    const submitLabel = $("submitAuthButton")?.querySelector("span");
    if (submitLabel) submitLabel.textContent = isRegisterMode ? "Create Account" : "Login";
    if ($("toggleAuthMode")) {
      $("toggleAuthMode").textContent = isRegisterMode
        ? "Already have an account? Login"
        : "Create account";
    }

    const nameLabel = $("authName")?.closest("label");
    if (nameLabel) nameLabel.hidden = !isRegisterMode;
    if ($("authName")) $("authName").required = isRegisterMode;
  }
}

async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";

  try {
    return Notification.requestPermission();
  } catch (error) {
    console.warn("[events] Notification permission request failed:", error);
    return "error";
  }
}

function defaultPreferences() {
  return {
    pageZoom: 100,
    compactMode: false,
    focusCards: false,
  };
}

function readSettingsPreferences() {
  return {
    pageZoom: Number($("settingsPageZoom")?.value) || 100,
    compactMode: Boolean($("settingsCompactMode")?.checked),
    focusCards: Boolean($("settingsFocusCards")?.checked),
  };
}

function populateSettingsForm(state = {}) {
  const preferences = {
    ...defaultPreferences(),
    ...(state.preferences || {}),
  };

  if ($("settingsWorkspaceName")) $("settingsWorkspaceName").value = state.workspaceName || "My Workspace";
  if ($("settingsDisplayName")) $("settingsDisplayName").value = state.displayName || "Guest";
  if ($("settingsPageZoom")) $("settingsPageZoom").value = preferences.pageZoom;
  if ($("settingsCompactMode")) $("settingsCompactMode").checked = Boolean(preferences.compactMode);
  if ($("settingsFocusCards")) $("settingsFocusCards").checked = Boolean(preferences.focusCards);
  updateZoomOutput();
}

function updateZoomOutput() {
  if ($("settingsPageZoomValue")) {
    $("settingsPageZoomValue").textContent = `${$("settingsPageZoom")?.value || 100}%`;
  }
}
