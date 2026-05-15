const STORAGE_KEY = "atlas_workspace_state_v2";

const columns = [
  { id: "ideas", title: "Ideas" },
  { id: "doing", title: "Doing" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

let state = loadState();
let activeView = "dashboard";
let searchQuery = "";

const $ = (id) => document.getElementById(id);

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseTags(value = "") {
  return String(value)
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function renderMarkdown(markdown = "") {
  return escapeHtml(markdown)
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/gim, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}

function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === "function") {
    window.lucide.createIcons();
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.pages)) return saved;
  } catch {
    // ignore corrupted localStorage
  }

  const firstPage = {
    id: uid("page"),
    title: "Welcome to Atlas Workspace",
    icon: "A",
    status: "doing",
    tags: ["welcome", "workspace"],
    markdown: "# Welcome to Atlas Workspace\n\nTulis catatan, susun task, dan kelola reminder dari satu tempat.",
    reminderAt: "",
    reminderDone: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  return {
    workspaceName: "Personal OS",
    selectedPageId: firstPage.id,
    pages: [firstPage],
    updatedAt: nowIso(),
  };
}

function saveState() {
  state.updatedAt = nowIso();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function selectedPage() {
  return state.pages.find((page) => page.id === state.selectedPageId) || state.pages[0] || null;
}

function filteredPages() {
  const q = searchQuery.toLowerCase();

  return state.pages.filter((page) => {
    const text = `${page.title} ${page.markdown} ${page.tags.join(" ")}`.toLowerCase();
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

function renderSidebar() {
  const pages = filteredPages();

  if ($("workspaceName")) $("workspaceName").textContent = state.workspaceName || "Personal OS";
  if ($("pageCount")) $("pageCount").textContent = pages.length;

  if ($("pageList")) {
    $("pageList").innerHTML = pages
      .map(
        (page) => `
          <button class="page-item ${page.id === state.selectedPageId ? "active" : ""}" data-page-id="${page.id}">
            <span>${escapeHtml(page.icon || "P")}</span>
            <strong>${escapeHtml(page.title)}</strong>
          </button>
        `,
      )
      .join("");

    $("pageList").querySelectorAll("[data-page-id]").forEach((button) => {
      button.addEventListener("click", () => {
        state.selectedPageId = button.dataset.pageId;
        saveState();
        setView("notes");
        renderAll();
      });
    });
  }

  if ($("tagCloud")) {
    const tags = [...new Set(state.pages.flatMap((page) => page.tags || []))];

    $("tagCloud").innerHTML = tags.length
      ? tags.map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`).join("")
      : `<span class="muted">Belum ada tag</span>`;
  }
}

function renderDashboard() {
  const pages = filteredPages();
  const doing = pages.filter((page) => page.status === "doing");
  const review = pages.filter((page) => page.status === "review");
  const reminders = pages.filter((page) => page.reminderAt && !page.reminderDone);

  if ($("dashboardTotalPages")) $("dashboardTotalPages").textContent = pages.length;
  if ($("dashboardDoingPages")) $("dashboardDoingPages").textContent = doing.length;
  if ($("dashboardReviewPages")) $("dashboardReviewPages").textContent = review.length;
  if ($("dashboardReminderPages")) $("dashboardReminderPages").textContent = reminders.length;
  if ($("heroPageCount")) $("heroPageCount").textContent = pages.length;
  if ($("heroReminderCount")) $("heroReminderCount").textContent = reminders.length;

$("dashboardRecentPages").innerHTML = pages.length
  ? pages
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map(
        (page) => `
          <button class="dashboard-list-item" data-dashboard-page="${page.id}">
            <span class="page-dot">${escapeHtml(page.icon || "P")}</span>
            <span>
              <strong>${escapeHtml(page.title)}</strong>
              <small>${escapeHtml(page.status || "ideas")}</small>
            </span>
          </button>
        `,
      )
      .join("")
  : `
      <div class="empty-state">
        <strong>Belum ada halaman.</strong>
        <span>Buat halaman pertama untuk mulai menyusun workspace.</span>
      </div>
    `;

 $("dashboardDuePages").innerHTML = reminders.length
  ? reminders
      .slice(0, 5)
      .map(
        (page) => `
          <button class="dashboard-list-item" data-dashboard-page="${page.id}">
            <span class="page-dot">${escapeHtml(page.icon || "P")}</span>
            <span>
              <strong>${escapeHtml(page.title)}</strong>
              <small>${new Date(page.reminderAt).toLocaleString("id-ID")}</small>
            </span>
          </button>
        `,
      )
      .join("")
  : `
      <div class="empty-state">
        <strong>Tidak ada reminder aktif.</strong>
        <span>Tambahkan reminder dari halaman Notes.</span>
      </div>
    `;

}

function renderEditor() {
  const page = selectedPage();
  if (!page) return;

  if ($("titleInput")) $("titleInput").value = page.title || "";
  if ($("iconInput")) $("iconInput").value = page.icon || "";
  if ($("tagsInput")) $("tagsInput").value = (page.tags || []).join(", ");
  if ($("statusSelect")) $("statusSelect").value = page.status || "ideas";
  if ($("markdownInput")) $("markdownInput").value = page.markdown || "";
  if ($("markdownPreview")) $("markdownPreview").innerHTML = renderMarkdown(page.markdown || "");
  if ($("previewTags")) {
    $("previewTags").innerHTML = (page.tags || [])
      .map((tag) => `<span class="chip">#${escapeHtml(tag)}</span>`)
      .join("");
  }
}

function renderKanban() {
  const pages = filteredPages();

  if ($("kanbanMeta")) $("kanbanMeta").textContent = `${pages.length} kartu`;

  if (!$("kanbanBoard")) return;

  $("kanbanBoard").innerHTML = columns
    .map((column) => {
      const items = pages.filter((page) => page.status === column.id);

      return `
        <section class="kanban-column">
          <div class="kanban-column-header">
            <strong>${column.title}</strong>
            <span>${items.length}</span>
          </div>
          <div class="kanban-column-body">
            ${
              items.length
                ? items
                    .map(
                      (page) => `
                        <article class="kanban-card" data-open-page="${page.id}">
                          <strong>${escapeHtml(page.icon || "P")} ${escapeHtml(page.title)}</strong>
                          <p>${escapeHtml((page.markdown || "").replaceAll("#", "").slice(0, 90))}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="empty-state">Belum ada kartu.</p>`
            }
          </div>
        </section>
      `;
    })
    .join("");

  $("kanbanBoard").querySelectorAll("[data-open-page]").forEach((card) => {
    card.addEventListener("click", () => {
      state.selectedPageId = card.dataset.openPage;
      saveState();
      setView("notes");
      renderAll();
    });
  });
}

function renderReminders() {
  const reminders = filteredPages().filter((page) => page.reminderAt);

  if ($("reminderMeta")) {
    $("reminderMeta").textContent = reminders.length
      ? `${reminders.length} reminder`
      : "Tidak ada reminder";
  }

  if (!$("reminderList")) return;

  $("reminderList").innerHTML = reminders.length
    ? reminders
        .map(
          (page) => `
            <article class="reminder-item">
              <strong>${escapeHtml(page.title)}</strong>
              <span>${new Date(page.reminderAt).toLocaleString("id-ID")}</span>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">Belum ada reminder.</p>`;
}

function renderUser() {
  if ($("userName")) $("userName").textContent = "Guest";
  if ($("userEmail")) $("userEmail").textContent = "Offline-first workspace";
  if ($("userAvatar")) $("userAvatar").textContent = "G";
  if ($("syncStatusBadge")) $("syncStatusBadge").textContent = "Local workspace";
}

function renderAll() {
  setView(activeView);
  renderSidebar();
  renderDashboard();
  renderEditor();
  renderKanban();
  renderReminders();
  renderUser();
  refreshIcons();
}

function createPage() {
  const title = $("newPageTitle")?.value?.trim() || "Untitled";

  const page = {
    id: uid("page"),
    title,
    icon: title.slice(0, 1).toUpperCase(),
    status: $("newPageStatus")?.value || "ideas",
    tags: parseTags($("newPageTags")?.value || ""),
    markdown: `# ${title}\n\nMulai tulis catatan di sini.`,
    reminderAt: "",
    reminderDone: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.pages.push(page);
  state.selectedPageId = page.id;
  saveState();

  $("pageForm")?.reset();
  $("pageDialog")?.close();

  activeView = "notes";
  renderAll();
}

function bindEvents() {
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
    const pageExists = state.pages.some((page) => page.id === pageId);

    if (!pageExists) return;

    state.selectedPageId = pageId;
    saveState();
    setView("notes");
    renderAll();
  });

  $("searchInput")?.addEventListener("input", (event) => {
    searchQuery = event.target.value.trim();
    renderAll();
  });

  $("dashboardNewPageButton")?.addEventListener("click", () => $("pageDialog")?.showModal());
  $("newPageButton")?.addEventListener("click", () => $("pageDialog")?.showModal());
  $("newCardButton")?.addEventListener("click", () => $("pageDialog")?.showModal());

  $("pageForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createPage();
  });

  $("titleInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.title = event.target.value || "Untitled";
    page.updatedAt = nowIso();
    saveState();
    renderSidebar();
    renderDashboard();
    renderKanban();
  });

  $("iconInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.icon = event.target.value || "P";
    page.updatedAt = nowIso();
    saveState();
    renderAll();
  });

  $("tagsInput")?.addEventListener("change", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.tags = parseTags(event.target.value);
    page.updatedAt = nowIso();
    saveState();
    renderAll();
  });

  $("statusSelect")?.addEventListener("change", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.status = event.target.value;
    page.updatedAt = nowIso();
    saveState();
    renderAll();
  });

  $("markdownInput")?.addEventListener("input", (event) => {
    const page = selectedPage();
    if (!page) return;
    page.markdown = event.target.value;
    page.updatedAt = nowIso();
    saveState();
    renderEditor();
    renderDashboard();
    renderKanban();
  });

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => {
      button.closest("dialog")?.close();
    });
  });

  $("themeToggle")?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("atlas-theme", next);
  });
}

function populateStatusOptions() {
  const options = columns.map((column) => `<option value="${column.id}">${column.title}</option>`).join("");

  if ($("statusSelect")) $("statusSelect").innerHTML = options;
  if ($("newPageStatus")) $("newPageStatus").innerHTML = options;
}

function initTheme() {
  const theme = localStorage.getItem("atlas-theme") || "light";
  document.documentElement.dataset.theme = theme;
}

export function initAtlasRuntime() {
  initTheme();
  populateStatusOptions();
  bindEvents();
  renderAll();

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
}