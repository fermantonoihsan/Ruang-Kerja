import { getWorkspaceColumns } from "../../config/constants.js";
import { getState, saveState, selectedPage } from "../../state/store.js";
import { generateId, getTodayISO, parseTags } from "../../utils/helpers.js";
import { renderEditor } from "./notes.render.js";

export function renderNotes() {
  renderEditor({ page: selectedPage() });
}

export function createPage(pageInput = {}) {
  const state = getState();
  const title = pageInput.title?.trim?.() || "Untitled";
  const workspaceColumns = getWorkspaceColumns(state.templateId);
  const page = {
    id: generateId("page"),
    title,
    icon: pageInput.icon || title.slice(0, 1).toUpperCase(),
    status: pageInput.status || workspaceColumns[0]?.id || "ideas",
    tags: parseTags(pageInput.tags || ""),
    markdown: pageInput.markdown || `# ${title}\n\nStart writing your notes here.`,
    reminderAt: pageInput.reminderAt || "",
    dueDate: pageInput.dueDate || "",
    reminderDone: Boolean(pageInput.reminderDone),
    priority: pageInput.priority || "normal",
    checklist: Array.isArray(pageInput.checklist) ? pageInput.checklist : [],
    links: Array.isArray(pageInput.links) ? pageInput.links : [],
    createdAt: getTodayISO(),
    updatedAt: getTodayISO(),
  };

  state.pages.push(page);
  state.selectedPageId = page.id;
  saveState();
  return page;
}

export function updatePage(patch) {
  const page = selectedPage();
  if (!page) return null;

  Object.assign(page, patch, { updatedAt: getTodayISO() });
  saveState();
  return page;
}

export function deletePage() {
  const state = getState();
  const page = selectedPage();
  if (!page) return null;

  state.pages = state.pages.filter((item) => item.id !== page.id);
  state.selectedPageId = state.pages[0]?.id || "";
  saveState();
  return page;
}

export function duplicatePage() {
  const page = selectedPage();
  if (!page) return null;

  return createPage({
    ...page,
    title: `${page.title || "Untitled"} Copy`,
    tags: page.tags || [],
    checklist: (page.checklist || []).map((item) => ({ ...item, id: generateId("check") })),
    links: (page.links || []).map((item) => ({ ...item, id: generateId("link") })),
  });
}

export function selectPage(pageId) {
  const state = getState();
  if (pageId && state.pages?.some((page) => page.id === pageId)) {
    state.selectedPageId = pageId;
    saveState();
  }

  return selectedPage();
}

export function filterPages(query = "") {
  const q = query.toLowerCase();
  return (getState().pages || []).filter((page) => {
    const linkText = (page.links || []).map((link) => `${link.label} ${link.url} ${link.type}`).join(" ");
    const checklistText = (page.checklist || []).map((item) => item.text).join(" ");
    const text =
      `${page.title} ${page.markdown} ${page.priority} ${page.dueDate} ${linkText} ${checklistText} ${(page.tags || []).join(" ")}`.toLowerCase();
    return !q || text.includes(q);
  });
}
