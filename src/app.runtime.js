import { columns, rfqColumns } from "./config/constants.js";
import {
  clearFirebaseConfig,
  getFirebaseConfig,
  saveFirebaseConfig,
} from "./config/firebase.config.js";
import { createWorkspaceFromTemplate } from "./config/templates.js";
import { renderDashboard } from "./features/dashboard/dashboard.render.js";
import { renderKanban } from "./features/kanban/kanban.render.js";
import { renderEditor } from "./features/notes/notes.render.js";
import { renderReminders } from "./features/reminders/reminders.render.js";
import { renderRfqTracker } from "./features/rfq/rfq.render.js";
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
import { importRfqCsvText } from "./services/rfq-import.service.js";
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
import { formatDate, generateId, getTodayISO, parseTags } from "./utils/helpers.js";

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

function closeDialog(dialogId) {
  const dialog = $(dialogId);
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

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
  const nextView = view === "rfq" && state?.templateId !== "procurement" ? "dashboard" : view;
  activeView = nextView;

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === nextView);
  });

  [
    ["dashboard", $("dashboardView")],
    ["notes", $("notesView")],
    ["kanban", $("kanbanView")],
    ["rfq", $("rfqView")],
    ["reminders", $("remindersView")],
  ].forEach(([name, node]) => {
    if (node) node.classList.toggle("active", name === nextView);
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

function movePageToStatus(pageId, status) {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page || !columns.some((column) => column.id === status)) return;

  page.status = status;
  page.updatedAt = getTodayISO();
  saveState();
  renderAll();
}

function moveRfqToStatus(pageId, rfqStatus) {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page || !rfqColumns.some((column) => column.id === rfqStatus)) return;

  page.rfqStatus = rfqStatus;
  page.updatedAt = getTodayISO();
  saveState();
  renderAll();
}

function createPage() {
  const title = $("newPageTitle")?.value?.trim() || "Untitled";

  const page = {
    id: generateId("page"),
    title,
    icon: title.slice(0, 1).toUpperCase(),
    status: $("newPageStatus")?.value || "ideas",
    rfqStatus: state.templateId === "procurement" ? "request" : "",
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
  closeDialog("pageDialog");

  activeView = "notes";
  renderAll();
}

function createRfqItem() {
  const now = getTodayISO();
  const page = {
    id: generateId("page"),
    title: "New RFQ Item",
    icon: "R",
    status: "doing",
    rfqStatus: "request",
    tags: ["rfq", "procurement"],
    markdown:
      "# New RFQ Item\n\n## Request\n- Requester:\n- Item/service:\n- Required date:\n- Budget type:\n\n## Vendors\n- Vendor A:\n- Vendor B:\n- Vendor C:\n\n## Checklist\n- [ ] Confirm specification\n- [ ] Send RFQ\n- [ ] Compare quotations\n- [ ] Negotiate\n- [ ] Submit for approval\n- [ ] Issue PO\n- [ ] Track delivery",
    reminderAt: "",
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
  };

  state.pages.push(page);
  state.selectedPageId = page.id;
  saveState();
  activeView = "rfq";
  renderAll();
}

async function importRfqFile(file) {
  if (!file) return;

  const fileName = file.name || "";
  const extension = fileName.split(".").pop()?.toLowerCase();
  let csvText = "";

  if (extension === "xlsx" || extension === "xls") {
    if (!window.XLSX) {
      window.alert("Excel import library is still loading or unavailable. Please try again, or save the file as CSV.");
      return;
    }

    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    csvText = window.XLSX.utils.sheet_to_csv(worksheet);
  } else {
    csvText = await file.text();
  }

  const result = importRfqCsvText(csvText, state);

  if (!result.imported && !result.updated) {
    window.alert("No RFQ data was imported. Please check the CSV headers and rows.");
    return;
  }

  state.templateId = "procurement";
  state.workspaceName = state.workspaceName || "Procurement Workspace";
  saveState();
  activeView = "rfq";
  renderAll();
  window.alert(
    `RFQ import complete: ${result.imported} new RFQ item(s), ${result.updated} updated, ${result.bidRows} supplier bid row(s).`,
  );
}

function downloadRfqTemplate() {
  const headers = [
    "RFQ Number",
    "Item Name",
    "Specification",
    "Quantity",
    "UOM",
    "Requester",
    "Required Date",
    "Vendor Name",
    "Vendor Contact",
    "Bid Date",
    "Currency",
    "Unit Price",
    "Total Price",
    "Lead Time",
    "Payment Terms",
    "Warranty",
    "Delivery Terms",
    "Technical Compliance",
    "Bid Status",
    "Recommendation",
    "RFQ Status",
  ];

  const sampleRows = [
    [
      "RFQ-001",
      "Centrifugal Pump",
      "API 610 compliant pump",
      "2",
      "unit",
      "Maintenance",
      "2026-06-30",
      "Vendor A",
      "sales@vendor-a.com",
      "2026-05-20",
      "IDR",
      "15000000",
      "30000000",
      "30 days",
      "30 days",
      "12 months",
      "DAP Plant",
      "Compliant",
      "Bid Received",
      "Recommended",
      "Quotation Received",
    ],
    [
      "RFQ-001",
      "Centrifugal Pump",
      "API 610 compliant pump",
      "2",
      "unit",
      "Maintenance",
      "2026-06-30",
      "Vendor B",
      "sales@vendor-b.com",
      "2026-05-21",
      "IDR",
      "14500000",
      "29000000",
      "45 days",
      "45 days",
      "12 months",
      "DAP Plant",
      "Need Clarification",
      "Clarification Needed",
      "Review",
      "Quotation Received",
    ],
  ];

  const csv = [headers, ...sampleRows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "atlas-rfq-supplier-bids-template.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function openTemplateChooser() {
  closeDialog("settingsDialog");
  window.setTimeout(() => {
    openDialog("templateDialog");
  }, 0);
}

function applyTemplate(templateId) {
  const currentState = getState();
  const hasExistingWorkspace = Boolean(currentState.templateId || (currentState.pages || []).length > 1);

  if (hasExistingWorkspace) {
    const shouldReplace = window.confirm(
      "Changing template will replace your current workspace pages with the selected starter board. Continue?",
    );

    if (!shouldReplace) return;
  }

  const nextWorkspace = createWorkspaceFromTemplate(templateId);
  replaceState(nextWorkspace);
  state = getState();
  closeDialog("templateDialog");
  activeView = "dashboard";
  renderAll();
}

function renderAll() {
  state = getState();
  ensureProcurementRfqStatuses();
  const pages = filteredPages();

  applyWorkspacePreferences(state.preferences);
  renderTemplateVisibility();
  setView(activeView);
  renderSidebar({ state, pages, onSelectPage: selectPage });
  renderDashboard({ state, filteredPages: pages, setView, renderAll });
  renderEditor({ page: selectedPage() });
  renderKanban({ pages, columns, onOpenPage: selectPage, onMovePage: movePageToStatus });
  renderRfqTracker({ pages, columns: rfqColumns, onOpenPage: selectPage, onMoveRfq: moveRfqToStatus });
  renderReminders({ pages });
  renderUser({ user: currentUser, syncStatus, guestName: state.displayName });
  refreshIcons();
}

function renderTemplateVisibility() {
  const isProcurement = state.templateId === "procurement";

  document.querySelectorAll("[data-procurement-only]").forEach((node) => {
    node.hidden = !isProcurement;
    node.style.display = isProcurement ? "" : "none";
  });

  if (!isProcurement && activeView === "rfq") {
    activeView = "dashboard";
  }
}

function ensureProcurementRfqStatuses() {
  if (state.templateId !== "procurement") return;

  let didPatch = false;

  (state.pages || []).forEach((page) => {
    if (page.rfqStatus) return;

    const tags = page.tags || [];
    const title = (page.title || "").toLowerCase();

    if (tags.includes("po") || title.includes("po ")) {
      page.rfqStatus = "po-issued";
    } else if (tags.includes("vendor") || tags.includes("evaluation")) {
      page.rfqStatus = "negotiation";
    } else if (tags.includes("rfq") || title.includes("rfq")) {
      page.rfqStatus = "quotation-received";
    } else if (tags.includes("contract")) {
      page.rfqStatus = "request";
    }

    if (page.rfqStatus) {
      didPatch = true;
    }
  });

  if (didPatch) {
    saveState();
    state = getState();
  }
}

function applyWorkspacePreferences(preferences = {}) {
  const pageZoom = Number(preferences.pageZoom) || 100;
  document.documentElement.style.setProperty("--page-zoom", `${pageZoom / 100}`);
  document.body.classList.toggle("compact-mode", Boolean(preferences.compactMode));
  document.body.classList.toggle("focus-cards", Boolean(preferences.focusCards));
}

let toastTimer = null;

function showToast(message) {
  const toast = $("toast");
  if (!toast) return false;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");

  toastTimer = window.setTimeout(() => {
    toast.classList.remove("show");
  }, 7000);

  return true;
}

function showReminderFallback(page) {
  const title = page.title || "Reminder";
  const dueTime = page.reminderAt ? ` Due: ${formatDate(page.reminderAt, "en-US")}.` : "";

  return showToast(`Reminder: ${title}.${dueTime}`);
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
      const didAlert = didNotify || showReminderFallback(page);
      if (!didAlert) continue;

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
        return;
      }

      showToast("Browser notifications are not enabled. Atlas will show reminder alerts inside the app.");
    },
    onSearchChange(query) {
      searchQuery = query;
      renderAll();
    },
  });

  document.querySelectorAll("[data-template-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      applyTemplate(button.dataset.templateChoice);
    });
  });

  $("openTemplateChooser")?.addEventListener("click", () => {
    openTemplateChooser();
  });

  $("newRfqButton")?.addEventListener("click", () => {
    createRfqItem();
  });

  $("rfqImportInput")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    await importRfqFile(file);
    event.target.value = "";
  });

  $("downloadRfqTemplate")?.addEventListener("click", () => {
    downloadRfqTemplate();
  });

  renderAll();
  if (!state.templateId) {
    openDialog("templateDialog");
  }
  registerServiceWorker();
  startReminderScheduler();
}
