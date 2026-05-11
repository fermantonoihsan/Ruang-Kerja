const STORAGE_KEY = "atlas_workspace_state_v1";
const CLOUD_CONFIG_KEY = "atlas_workspace_cloud_v1";
const FIRED_REMINDERS_KEY = "atlas_workspace_fired_reminders_v1";

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDDaZN9mPXPGrBMYykTnwguNsJp27JPLow",
  authDomain: "atlas-workspace-af04b.firebaseapp.com",
  projectId: "atlas-workspace-af04b",
  storageBucket: "atlas-workspace-af04b.firebasestorage.app",
  messagingSenderId: "1090000836099",
  appId: "1:1090000836099:web:185ac63fa0d34b965de036",
  measurementId: "G-NJK0P498EJ"
};

const columns = [
  { id: "ideas", title: "Ideas", color: "#315f95" },
  { id: "doing", title: "Doing", color: "#14715f" },
  { id: "review", title: "Review", color: "#c65f45" },
  { id: "done", title: "Done", color: "#677076" },
];

let state = loadState();
let config = loadCloudConfig();
let firebaseApp = null;
let authClient = null;
let firestoreClient = null;
let currentUser = null;
let authMode = "login";
let activeView = "dashboard";
let activeTag = "";
let searchQuery = "";
let syncTimer = null;
let toastTimer = null;

const el = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  initTheme();
  bindEvents();
  populateStatusSelects();
  initFirebase();
  renderAll();
  installReminderLoop();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});

function initTheme() {
  const savedTheme = localStorage.getItem("atlas-theme") || "light";
  document.documentElement.dataset.theme = savedTheme;

  if (el.themeToggle) {
    el.themeToggle.innerHTML = savedTheme === "dark"
      ? `<i data-lucide="sun"></i>`
      : `<i data-lucide="moon"></i>`;
  }
}

function cacheElements() {
  [
    "syncStatus",
    "sidebar",
    "sidebarToggle",
    "searchInput",
    "notificationButton",
    "settingsButton",
    "authButton",
    "themeToggle",
    "dashboardView",
    "dashboardNewPageButton",
    "dashboardTotalPages",
    "dashboardDoingPages",
    "dashboardReviewPages",
    "dashboardReminderPages",
    "dashboardRecentPages",
    "dashboardDuePages",
    "workspaceName",
    "newPageButton",
    "pageCount",
    "pageList",
    "tagCloud",
    "clearTagFilter",
    "userAvatar",
    "userName",
    "userEmail",
    "notesView",
    "kanbanView",
    "remindersView",
    "deletePageButton",
    "duplicatePageButton",
    "statusSelect",
    "titleInput",
    "iconInput",
    "tagsInput",
    "reminderInput",
    "markdownInput",
    "previewTags",
    "markdownPreview",
    "kanbanMeta",
    "kanbanBoard",
    "newCardButton",
    "reminderMeta",
    "requestReminderPermission",
    "reminderList",
    "authDialog",
    "authForm",
    "authTitle",
    "authSubtitle",
    "authName",
    "authEmail",
    "authPassword",
    "toggleAuthMode",
    "submitAuthButton",
    "settingsDialog",
    "settingsForm",
    "firebaseApiKey",
    "firebaseAuthDomain",
    "firebaseProjectId",
    "firebaseAppId",
    "clearCloudConfig",
    "pageDialog",
    "pageForm",
    "newPageTitle",
    "newPageStatus",
    "newPageTags",
    "toast",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
}

function bindEvents() {
  el.sidebarToggle.addEventListener("click", () => {
    el.sidebar.classList.toggle("open");
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      activeView = button.dataset.view;
      el.sidebar.classList.remove("open");
      renderViews();
    });
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest("dialog")?.close();
    });
  });

  el.searchInput.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim().toLowerCase();
    renderSidebar();
    renderDashboard();
    renderKanban();
    renderReminders();
  });

  el.newPageButton.addEventListener("click", () => openPageDialog());
  el.dashboardNewPageButton?.addEventListener("click", () => openPageDialog());

el.themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  document.documentElement.dataset.theme = nextTheme;
  localStorage.setItem("atlas-theme", nextTheme);

  el.themeToggle.innerHTML = nextTheme === "dark"
    ? `<i data-lucide="sun"></i>`
    : `<i data-lucide="moon"></i>`;

  refreshIcons();
});
  el.newCardButton.addEventListener("click", () => openPageDialog("ideas"));

  el.pageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createPage({
      title: el.newPageTitle.value.trim(),
      status: el.newPageStatus.value,
      tags: parseTags(el.newPageTags.value),
    });
    el.pageDialog.close();
    el.pageForm.reset();
  });

  el.titleInput.addEventListener("input", () => updateSelectedPage({ title: el.titleInput.value || "Untitled" }));
  el.iconInput.addEventListener("input", () => updateSelectedPage({ icon: el.iconInput.value.trim() || "*" }));
  el.tagsInput.addEventListener("change", () => updateSelectedPage({ tags: parseTags(el.tagsInput.value) }));
  el.statusSelect.addEventListener("change", () => updateSelectedPage({ status: el.statusSelect.value }));
  el.reminderInput.addEventListener("change", () => {
    updateSelectedPage({
      reminderAt: el.reminderInput.value ? new Date(el.reminderInput.value).toISOString() : "",
      reminderDone: false,
    });
  });
  el.markdownInput.addEventListener("input", () => updateSelectedPage({ markdown: el.markdownInput.value }, false));
  el.markdownInput.addEventListener("blur", () => saveAndRender());

  el.deletePageButton.addEventListener("click", deleteSelectedPage);
  el.duplicatePageButton.addEventListener("click", duplicateSelectedPage);

  el.clearTagFilter.addEventListener("click", () => {
    activeTag = "";
    renderAll();
  });

  el.notificationButton.addEventListener("click", requestNotifications);
  el.requestReminderPermission.addEventListener("click", requestNotifications);

  el.settingsButton.addEventListener("click", () => {
    el.firebaseApiKey.value = config.apiKey || "";
    el.firebaseAuthDomain.value = config.authDomain || "";
    el.firebaseProjectId.value = config.projectId || "";
    el.firebaseAppId.value = config.appId || "";
    openDialog(el.settingsDialog);
  });

  el.settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    config = {
      apiKey: el.firebaseApiKey.value.trim(),
      authDomain: el.firebaseAuthDomain.value.trim(),
      projectId: el.firebaseProjectId.value.trim(),
      appId: el.firebaseAppId.value.trim(),
    };
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
    el.settingsDialog.close();
    initFirebase(true);
  });

  el.clearCloudConfig.addEventListener("click", () => {
    config = { apiKey: "", authDomain: "", projectId: "", appId: "" };
    localStorage.removeItem(CLOUD_CONFIG_KEY);
    firebaseApp = null;
    authClient = null;
    firestoreClient = null;
    currentUser = null;
    el.settingsDialog.close();
    updateSyncStatus("Local mode");
    renderUser();
    toast("Cloud config dihapus. App berjalan lokal.");
  });

  el.authButton.addEventListener("click", () => {
  if (currentUser) {
    signOut();
    return;
  }

  if (!authClient) {
    toast("Firebase belum siap. Cek konfigurasi project.");
    return;
  }

  openAuthDialog("login");
});
  
  el.toggleAuthMode.addEventListener("click", () => {
    openAuthDialog(authMode === "login" ? "signup" : "login");
  });

  el.authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleAuthSubmit();
  });
}

function populateStatusSelects() {
  const options = columns.map((column) => `<option value="${column.id}">${column.title}</option>`).join("");
  el.statusSelect.innerHTML = options;
  el.newPageStatus.innerHTML = options;
}

function loadState() {
  const saved = safeJson(localStorage.getItem(STORAGE_KEY));
  if (saved && Array.isArray(saved.pages)) {
    return normalizeState(saved);
  }
  return createDefaultState();
}

function normalizeState(raw) {
  const now = new Date().toISOString();
  const pages = raw.pages.map((page, index) => ({
    id: page.id || uid("page"),
    title: page.title || "Untitled",
    icon: page.icon || "*",
    markdown: page.markdown || "",
    tags: Array.isArray(page.tags) ? page.tags : parseTags(page.tags || ""),
    status: columns.some((column) => column.id === page.status) ? page.status : "ideas",
    position: Number.isFinite(page.position) ? page.position : index,
    reminderAt: page.reminderAt || "",
    reminderDone: Boolean(page.reminderDone),
    createdAt: page.createdAt || now,
    updatedAt: page.updatedAt || now,
  }));

  return {
    workspaceName: raw.workspaceName || "Personal OS",
    selectedPageId: raw.selectedPageId || pages[0]?.id || "",
    pages,
    updatedAt: raw.updatedAt || now,
  };
}

function createDefaultState() {
  const now = new Date().toISOString();
  const pageA = {
    id: uid("page"),
    title: "Product Roadmap",
    icon: "R",
    status: "doing",
    position: 0,
    tags: ["product", "planning"],
    reminderAt: addHours(20),
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
    markdown:
      "# Product Roadmap\n\n## Fokus minggu ini\n- [x] Rapikan struktur workspace\n- [ ] Validasi user onboarding\n- [ ] Siapkan release checklist\n\n> Semua page otomatis muncul sebagai kartu Kanban.\n\n## Metric\n**Activation:** user membuat 3 page pertama dalam 1 sesi.",
  };

  const pageB = {
    id: uid("page"),
    title: "Meeting Notes",
    icon: "M",
    status: "review",
    position: 0,
    tags: ["meeting"],
    reminderAt: addHours(44),
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
    markdown:
      "# Meeting Notes\n\nTanggal: Jumat\n\n## Agenda\n1. Review board\n2. Prioritas sprint\n3. Risiko release\n\n## Keputusan\n- Pakai Firebase Auth untuk login\n- Simpan workspace ke Cloud Firestore dengan Security Rules",
  };

  const pageC = {
    id: uid("page"),
    title: "Research Vault",
    icon: "V",
    status: "ideas",
    position: 0,
    tags: ["research", "ideas"],
    reminderAt: "",
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
    markdown:
      "# Research Vault\n\nGunakan area ini untuk menyimpan link, insight, dan draft.\n\n```js\nconst nextStep = \"ship useful workspace\";\n```\n\n[Firebase](https://firebase.google.com) cocok untuk auth, Firestore sync, dan hosting.",
  };

  const pageD = {
    id: uid("page"),
    title: "Launch Checklist",
    icon: "L",
    status: "done",
    position: 0,
    tags: ["launch", "ops"],
    reminderAt: "",
    reminderDone: true,
    createdAt: now,
    updatedAt: now,
    markdown:
      "# Launch Checklist\n\n- [x] Responsive layout\n- [x] Markdown preview\n- [x] Kanban drag-drop\n- [x] Reminder center\n- [ ] Deploy ke Vercel atau Netlify",
  };

  return {
    workspaceName: "Personal OS",
    selectedPageId: pageA.id,
    pages: [pageA, pageB, pageC, pageD],
    updatedAt: now,
  };
}

function loadCloudConfig() {
  return { ...DEFAULT_FIREBASE_CONFIG };
}

function safeJson(value) {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function uid(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function addHours(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function saveAndRender(sync = true) {
  state.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (sync && currentUser && firestoreClient) {
    queueCloudSync();
  }
  renderAll();
}

function updateSelectedPage(patch, render = true) {
  const page = getSelectedPage();
  if (!page) return;
  Object.assign(page, patch, { updatedAt: new Date().toISOString() });
  if (patch.markdown !== undefined) {
    state.updatedAt = new Date().toISOString();
    renderPreview(page);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    queueCloudSync();
    return;
  }
  if (render) saveAndRender();
}

function getSelectedPage() {
  return state.pages.find((page) => page.id === state.selectedPageId) || state.pages[0] || null;
}

function createPage({ title, status = "ideas", tags = [] }) {
  const newPage = {
    id: uid("page"),
    title: title || "Untitled",
    icon: (title || "U").trim().slice(0, 1).toUpperCase(),
    status,
    position: getPagesByStatus(status).length,
    tags,
    reminderAt: "",
    reminderDone: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    markdown: `# ${title || "Untitled"}\n\nMulai tulis catatan di sini.\n\n- [ ] Langkah pertama`,
  };
  state.pages.push(newPage);
  state.selectedPageId = newPage.id;
  activeView = "notes";
  saveAndRender();
  toast("Halaman baru dibuat.");
}

function deleteSelectedPage() {
  if (state.pages.length <= 1) {
    toast("Workspace harus punya minimal satu halaman.");
    return;
  }
  const page = getSelectedPage();
  if (!page) return;
  const ok = confirm(`Hapus "${page.title}"?`);
  if (!ok) return;
  state.pages = state.pages.filter((item) => item.id !== page.id);
  state.selectedPageId = state.pages[0]?.id || "";
  saveAndRender();
  toast("Halaman dihapus.");
}

function duplicateSelectedPage() {
  const page = getSelectedPage();
  if (!page) return;
  const copy = {
    ...page,
    id: uid("page"),
    title: `${page.title} Copy`,
    position: getPagesByStatus(page.status).length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  state.pages.push(copy);
  state.selectedPageId = copy.id;
  saveAndRender();
  toast("Halaman diduplikasi.");
}

function parseTags(value) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .filter((tag, index, list) => list.indexOf(tag) === index);
}

function getPagesByStatus(status) {
  return state.pages
    .filter((page) => page.status === status)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || a.updatedAt.localeCompare(b.updatedAt));
}

function filteredPages() {
  return state.pages.filter((page) => {
    const haystack = `${page.title} ${page.markdown} ${page.tags.join(" ")}`.toLowerCase();
    const matchesQuery = !searchQuery || haystack.includes(searchQuery);
    const matchesTag = !activeTag || page.tags.includes(activeTag);
    return matchesQuery && matchesTag;
  });
}

function renderAll() {
  renderViews();
  renderSidebar();
  renderDashboard();
  renderEditor();
  renderKanban();
  renderReminders();
  renderUser();
  refreshIcons();
}

function renderViews() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === activeView);
  });
  [
  ["dashboard", el.dashboardView],
  ["notes", el.notesView],
  ["kanban", el.kanbanView],
  ["reminders", el.remindersView],
].forEach(([view, node]) => {
  node?.classList.toggle("active", activeView === view);
});
  refreshIcons();
}

function renderSidebar() {
  const pages = filteredPages().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  el.workspaceName.textContent = state.workspaceName;
  el.pageCount.textContent = String(pages.length);

  if (!pages.length) {
    el.pageList.innerHTML = `<div class="empty-state">Tidak ada page yang cocok.</div>`;
    } else {
    el.pageList.innerHTML = pages
      .map(
        (page) => `
          <button class="page-item ${page.id === state.selectedPageId ? "active" : ""}" data-page-id="${page.id}">
            <span class="page-icon">${escapeHtml(page.icon || "*")}</span>
            <span>
              <strong>${escapeHtml(page.title)}</strong>
              <small>${formatRelative(page.updatedAt)} - ${statusTitle(page.status)}</small>
            </span>
          </button>
        `,
      )
      .join("");
  }

  el.pageList.querySelectorAll("[data-page-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPageId = button.dataset.pageId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      el.sidebar.classList.remove("open");
      activeView = "notes";
      renderAll();
    });
  });

  const tags = [...new Set(state.pages.flatMap((page) => page.tags))].sort();
  el.tagCloud.innerHTML = tags.length
    ? tags
        .map((tag) => `<button class="chip ${activeTag === tag ? "active" : ""}" data-tag="${tag}">#${escapeHtml(tag)}</button>`)
        .join("")
    : `<span class="chip">Belum ada tag</span>`;

  el.tagCloud.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTag = activeTag === button.dataset.tag ? "" : button.dataset.tag;
      renderAll();
    });
  });
}

function renderDashboard() {
  if (!el.dashboardView) return;

  const pages = filteredPages();
  const doingPages = pages.filter((page) => page.status === "doing");
  const reviewPages = pages.filter((page) => page.status === "review");
  const reminderPages = pages.filter((page) => page.reminderAt && !page.reminderDone);

  if (el.dashboardTotalPages) el.dashboardTotalPages.textContent = String(pages.length);
  if (el.dashboardDoingPages) el.dashboardDoingPages.textContent = String(doingPages.length);
  if (el.dashboardReviewPages) el.dashboardReviewPages.textContent = String(reviewPages.length);
  if (el.dashboardReminderPages) el.dashboardReminderPages.textContent = String(reminderPages.length);

  const recentPages = [...pages]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 5);

  if (el.dashboardRecentPages) {
    el.dashboardRecentPages.innerHTML = recentPages.length
      ? recentPages.map((page) => `
          <button class="dashboard-list-item" data-dashboard-page="${page.id}">
            <span class="page-dot">${escapeHtml(page.icon || "*")}</span>
            <span>
              <strong>${escapeHtml(page.title)}</strong>
              <small>${formatRelative(page.updatedAt)} · ${statusTitle(page.status)}</small>
            </span>
          </button>
        `).join("")
      : `
        <div class="empty-state">
          <strong>Belum ada page.</strong>
          <span>Buat halaman pertama untuk mulai bekerja.</span>
        </div>
      `;
  }

  const duePages = [...reminderPages]
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt))
    .slice(0, 5);

  if (el.dashboardDuePages) {
    el.dashboardDuePages.innerHTML = duePages.length
      ? duePages.map((page) => `
          <button class="dashboard-list-item" data-dashboard-page="${page.id}">
            <span class="page-dot">${escapeHtml(page.icon || "*")}</span>
            <span>
              <strong>${escapeHtml(page.title)}</strong>
              <small>${formatDate(page.reminderAt)}</small>
            </span>
          </button>
        `).join("")
      : `
        <div class="empty-state">
          <strong>Tidak ada reminder aktif.</strong>
          <span>Tambahkan reminder dari halaman notes.</span>
        </div>
      `;
  }

  el.dashboardView.querySelectorAll("[data-dashboard-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPageId = button.dataset.dashboardPage;
      activeView = "notes";
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
    });
  });
}

  el.pageList.querySelectorAll("[data-page-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPageId = button.dataset.pageId;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      el.sidebar.classList.remove("open");
      activeView = "notes";
      renderAll();
    });
  });

  const tags = [...new Set(state.pages.flatMap((page) => page.tags))].sort();
  el.tagCloud.innerHTML = tags.length
    ? tags
        .map((tag) => `<button class="chip ${activeTag === tag ? "active" : ""}" data-tag="${tag}">#${escapeHtml(tag)}</button>`)
        .join("")
    : `<span class="chip">Belum ada tag</span>`;

  el.tagCloud.querySelectorAll("[data-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      activeTag = activeTag === button.dataset.tag ? "" : button.dataset.tag;
      renderAll();
    });
  });


function renderEditor() {
  const page = getSelectedPage();
  if (!page) return;
  el.titleInput.value = page.title;
  el.iconInput.value = page.icon || "";
  el.tagsInput.value = page.tags.join(", ");
  el.statusSelect.value = page.status;
  el.reminderInput.value = page.reminderAt ? toLocalInputValue(page.reminderAt) : "";
  el.markdownInput.value = page.markdown || "";
  renderPreview(page);
}

function renderPreview(page) {
  el.previewTags.innerHTML = page.tags.map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("");
  el.markdownPreview.innerHTML = renderMarkdown(page.markdown || "");
}

function renderKanban() {
  const pages = filteredPages();
  el.kanbanMeta.textContent = `${pages.length} kartu`;

  el.kanbanBoard.innerHTML = columns
    .map((column) => {
      const items = pages
        .filter((page) => page.status === column.id)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

      const cards = items.length
        ? items
            .map(
              (page) => `
                <article class="kanban-card" draggable="true" data-card-id="${page.id}" data-status="${column.id}">
                  <strong>${escapeHtml(page.icon || "*")} ${escapeHtml(page.title)}</strong>
                  <p>${escapeHtml(summary(page.markdown))}</p>
                  <div class="chip-row">${page.tags.slice(0, 3).map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("")}</div>
                  <div class="card-footer">
                    <small>${page.reminderAt ? formatDate(page.reminderAt) : formatRelative(page.updatedAt)}</small>
                    <button class="text-button" data-open-page="${page.id}">Open</button>
                  </div>
                </article>
              `,
            )
            .join("")
        : `<div class="empty-state">Drop kartu di sini.</div>`;

      return `
        <section class="kanban-column" data-column-id="${column.id}">
          <div class="column-header">
            <strong><span class="status-dot" style="background:${column.color}"></span>${column.title}</strong>
            <span>${items.length}</span>
          </div>
          <div class="kanban-list">${cards}</div>
        </section>
      `;
    })
    .join("");

  bindKanbanEvents();
  refreshIcons();
}

function bindKanbanEvents() {
  el.kanbanBoard.querySelectorAll(".kanban-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.cardId);
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      el.kanbanBoard.querySelectorAll(".kanban-column").forEach((column) => column.classList.remove("drag-over"));
    });
    card.addEventListener("dragover", (event) => event.preventDefault());
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      movePage(event.dataTransfer.getData("text/plain"), card.dataset.status, card.dataset.cardId);
    });
  });

  el.kanbanBoard.querySelectorAll(".kanban-column").forEach((column) => {
    column.addEventListener("dragover", (event) => {
      event.preventDefault();
      column.classList.add("drag-over");
    });
    column.addEventListener("dragleave", () => column.classList.remove("drag-over"));
    column.addEventListener("drop", (event) => {
      event.preventDefault();
      column.classList.remove("drag-over");
      movePage(event.dataTransfer.getData("text/plain"), column.dataset.columnId);
    });
  });

  el.kanbanBoard.querySelectorAll("[data-open-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedPageId = button.dataset.openPage;
      activeView = "notes";
      saveAndRender(false);
    });
  });
}

function movePage(pageId, targetStatus, beforeId = "") {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page || !targetStatus) return;
  page.status = targetStatus;
  page.updatedAt = new Date().toISOString();

  const siblings = state.pages
    .filter((item) => item.status === targetStatus && item.id !== pageId)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const insertIndex = beforeId ? Math.max(0, siblings.findIndex((item) => item.id === beforeId)) : siblings.length;
  siblings.splice(insertIndex, 0, page);
  siblings.forEach((item, index) => {
    item.position = index;
  });

  state.selectedPageId = page.id;
  saveAndRender();
}

function renderReminders() {
  const reminders = filteredPages()
    .filter((page) => page.reminderAt)
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));

  const pending = reminders.filter((page) => !page.reminderDone);
  el.reminderMeta.textContent = pending.length ? `${pending.length} aktif` : "Tidak ada reminder aktif";

  if (!reminders.length) {
    el.reminderList.innerHTML = `<div class="empty-state">Belum ada reminder.</div>`;
    return;
  }

  el.reminderList.innerHTML = reminders
    .map((page) => {
      const due = !page.reminderDone && new Date(page.reminderAt) <= new Date();
      return `
        <article class="reminder-card ${due ? "due" : ""}">
          <div>
            <strong>${escapeHtml(page.icon || "*")} ${escapeHtml(page.title)}</strong>
            <small>${page.reminderDone ? "Selesai" : due ? "Jatuh tempo" : formatDate(page.reminderAt)}</small>
            <div class="chip-row">${page.tags.map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("")}</div>
          </div>
          <div class="reminder-actions">
            <button class="button button-quiet" data-snooze="${page.id}">
              <i data-lucide="clock-3"></i>
              <span>Snooze</span>
            </button>
            <button class="button" data-done="${page.id}">
              <i data-lucide="check"></i>
              <span>${page.reminderDone ? "Aktifkan" : "Done"}</span>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  el.reminderList.querySelectorAll("[data-snooze]").forEach((button) => {
    button.addEventListener("click", () => snoozeReminder(button.dataset.snooze));
  });
  el.reminderList.querySelectorAll("[data-done]").forEach((button) => {
    button.addEventListener("click", () => toggleReminderDone(button.dataset.done));
  });
  refreshIcons();
}

function snoozeReminder(pageId) {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page) return;
  page.reminderAt = addHours(24);
  page.reminderDone = false;
  page.updatedAt = new Date().toISOString();
  saveAndRender();
  toast("Reminder ditunda 24 jam.");
}

function toggleReminderDone(pageId) {
  const page = state.pages.find((item) => item.id === pageId);
  if (!page) return;
  page.reminderDone = !page.reminderDone;
  page.updatedAt = new Date().toISOString();
  saveAndRender();
}

function installReminderLoop() {
  checkReminders();
  setInterval(checkReminders, 30000);
}

function checkReminders() {
  const fired = new Set(safeJson(localStorage.getItem(FIRED_REMINDERS_KEY)) || []);
  const now = new Date();
  const duePages = state.pages.filter((page) => {
    if (!page.reminderAt || page.reminderDone) return false;
    const key = `${page.id}:${page.reminderAt}`;
    return new Date(page.reminderAt) <= now && !fired.has(key);
  });

  duePages.forEach((page) => {
    const key = `${page.id}:${page.reminderAt}`;
    fired.add(key);
    toast(`Reminder: ${page.title}`);
    if (window.Notification?.permission === "granted") {
      new Notification(page.title, {
        body: summary(page.markdown) || "Reminder workspace",
        tag: key,
      });
    }
  });

  if (duePages.length) {
    localStorage.setItem(FIRED_REMINDERS_KEY, JSON.stringify([...fired].slice(-200)));
    renderReminders();
  }
}

async function requestNotifications() {
  if (!("Notification" in window)) {
    toast("Browser ini belum mendukung notification.");
    return;
  }
  const permission = await Notification.requestPermission();
  toast(permission === "granted" ? "Reminder aktif." : "Reminder belum diizinkan.");
}

function renderUser() {
  const user = currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Guest";
  el.userName.textContent = displayName;
  el.userEmail.textContent = user?.email || (authClient ? "Belum login" : "Local workspace");
  el.userAvatar.textContent = displayName.slice(0, 1).toUpperCase();

  if (currentUser) {
    el.authButton.innerHTML = `<i data-lucide="log-out"></i><span>Logout</span>`;
  } else {
    el.authButton.innerHTML = `<i data-lucide="log-in"></i><span>Login</span>`;
  }
  refreshIcons();
}

function initFirebase(forceMessage = false) {
  if (!config.apiKey || !config.authDomain || !config.projectId || !config.appId) {
    firebaseApp = null;
    authClient = null;
    firestoreClient = null;
    currentUser = null;
    updateSyncStatus("Local mode");
    renderUser();
    return;
  }

  if (!window.firebase?.initializeApp) {
    updateSyncStatus("Firebase SDK belum siap");
    return;
  }

  try {
    const appName = `atlas-${config.projectId}`;
    const existingApp = window.firebase.apps.find((app) => app.name === appName);
    if (existingApp) {
      firebaseApp = existingApp;
    } else {
      firebaseApp = window.firebase.initializeApp(config, appName);
    }
    authClient = window.firebase.auth(firebaseApp);
    firestoreClient = window.firebase.firestore(firebaseApp);
    firestoreClient.enablePersistence({ synchronizeTabs: true }).catch(() => {});
  } catch (error) {
    firebaseApp = null;
    authClient = null;
    firestoreClient = null;
    updateSyncStatus("Firebase config error");
    toast(error.message);
    renderUser();
    return;
  }

  authClient.onAuthStateChanged((user) => {
    currentUser = user;
    renderUser();
    if (user) {
      pullCloudState();
    } else {
      updateSyncStatus("Cloud siap, belum login");
      if (forceMessage) toast("Cloud config tersimpan. Silakan login.");
    }
  });
}

function openAuthDialog(mode) {
  authMode = mode;
  const isSignup = mode === "signup";
  el.authTitle.textContent = isSignup ? "Buat Akun" : "Login";
  el.authSubtitle.textContent = isSignup ? "Akun Firebase untuk workspace sync." : "Masuk untuk cloud sync.";
  el.authName.closest("label").style.display = isSignup ? "grid" : "none";
  el.toggleAuthMode.textContent = isSignup ? "Sudah punya akun" : "Buat akun";
  el.submitAuthButton.innerHTML = isSignup ? `<i data-lucide="user-plus"></i><span>Daftar</span>` : `<i data-lucide="log-in"></i><span>Login</span>`;
  openDialog(el.authDialog);
  refreshIcons();
}

async function handleAuthSubmit() {
  if (!authClient) return;
  const email = el.authEmail.value.trim();
  const password = el.authPassword.value;
  updateSyncStatus("Authenticating...");

  try {
    const credential =
      authMode === "signup"
        ? await authClient.createUserWithEmailAndPassword(email, password)
        : await authClient.signInWithEmailAndPassword(email, password);

    if (authMode === "signup") {
      const displayName = el.authName.value.trim() || email.split("@")[0];
      await credential.user.updateProfile({ displayName });
    }

    currentUser = credential.user;
  } catch (error) {
    updateSyncStatus("Auth gagal");
    toast(firebaseErrorMessage(error));
    return;
  }

  el.authDialog.close();
  el.authForm.reset();
  toast(authMode === "signup" ? "Akun Firebase dibuat." : "Login berhasil.");
  if (currentUser) pullCloudState();
}

async function signOut() {
  if (!authClient) return;
  await queueCloudSync(true);
  await authClient.signOut();
  currentUser = null;
  updateSyncStatus("Cloud siap, belum login");
  renderUser();
  toast("Logout berhasil.");
}

async function pullCloudState() {
  if (!firestoreClient || !currentUser) return;
  updateSyncStatus("Syncing...");

  let snapshot;
  try {
    snapshot = await workspaceDocRef().get();
  } catch (error) {
    updateSyncStatus("Sync error");
    toast(firebaseErrorMessage(error));
    return;
  }

  if (snapshot.exists) {
    const remote = snapshot.data();
    const remoteData = remote?.data;
    const remoteUpdatedAt = remote?.updatedAt?.toDate?.() || remote?.updatedAt || remoteData?.updatedAt || 0;
    const remoteUpdated = new Date(remoteUpdatedAt).getTime();
    const localUpdated = new Date(state.updatedAt || 0).getTime();
    if (remoteData && remoteUpdated > localUpdated) {
      state = normalizeState(remoteData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderAll();
      toast("Workspace cloud dimuat.");
    } else {
      await queueCloudSync(true);
    }
  } else {
    await queueCloudSync(true);
  }

  updateSyncStatus(`Synced ${formatTime(new Date())}`);
}

function queueCloudSync(immediate = false) {
  if (!firestoreClient || !currentUser) return Promise.resolve();
  if (syncTimer) clearTimeout(syncTimer);

  if (immediate) {
    return pushCloudState();
  }

  syncTimer = setTimeout(pushCloudState, 900);
  updateSyncStatus("Pending sync...");
  return Promise.resolve();
}

async function pushCloudState() {
  if (!firestoreClient || !currentUser) return;
  updateSyncStatus("Syncing...");

  try {
    await workspaceDocRef().set(
      {
        data: state,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
        ownerEmail: currentUser.email || "",
      },
      { merge: true },
    );
  } catch (error) {
    updateSyncStatus("Sync error");
    toast(firebaseErrorMessage(error));
    return;
  }
  updateSyncStatus(`Synced ${formatTime(new Date())}`);
}

function workspaceDocRef() {
  return firestoreClient.collection("users").doc(currentUser.uid).collection("private").doc("workspace");
}

function firebaseErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "Email sudah terdaftar.",
    "auth/invalid-email": "Format email tidak valid.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/weak-password": "Password minimal 6 karakter.",
    "permission-denied": "Firestore rules menolak akses. Cek firebase.rules.",
  };
  return messages[error?.code] || error?.message || "Firebase error.";
}

function updateSyncStatus(message) {
  el.syncStatus.textContent = message;
}

function openPageDialog(status = "ideas") {
  el.newPageStatus.value = status;
  openDialog(el.pageDialog);
  setTimeout(() => el.newPageTitle.focus(), 50);
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  } else {
    dialog.setAttribute("open", "");
  }
  refreshIcons();
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let listType = "";
  let inCode = false;
  let codeLines = [];

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`);
      listType = "";
    }
  };

  lines.forEach((line) => {
    if (line.trim().startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
        codeLines = [];
        inCode = false;
      } else {
        closeList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!line.trim()) {
      closeList();
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      return;
    }

    if (line.startsWith(">")) {
      closeList();
      html.push(`<blockquote>${inlineMarkdown(line.replace(/^>\s?/, ""))}</blockquote>`);
      return;
    }

    const task = line.match(/^-\s+\[(x| )\]\s+(.+)$/i);
    if (task) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      const checked = task[1].toLowerCase() === "x" ? "checked" : "";
      html.push(`<li><input class="task-check" type="checkbox" ${checked} disabled />${inlineMarkdown(task[2])}</li>`);
      return;
    }

    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== "ul") {
        closeList();
        html.push("<ul>");
        listType = "ul";
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      return;
    }

    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== "ol") {
        closeList();
        html.push("<ol>");
        listType = "ol";
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  });

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
  }
  closeList();

  return html.join("\n") || `<p>Preview markdown akan muncul di sini.</p>`;
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, `<a href="$2" target="_blank" rel="noreferrer">$1</a>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function summary(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[#>*_`[\]()]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" ")
    .slice(0, 120);
}

function statusTitle(status) {
  return columns.find((column) => column.id === status)?.title || "Ideas";
}

function formatRelative(dateValue) {
  const date = new Date(dateValue);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (Number.isNaN(seconds)) return "";
  if (seconds < 60) return "baru saja";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.round(hours / 24);
  return `${days} hari lalu`;
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatTime(date) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toLocalInputValue(dateValue) {
  const date = new Date(dateValue);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function toast(message) {
  if (!message) return;
  el.toast.textContent = message;
  el.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.remove("show"), 2800);
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
