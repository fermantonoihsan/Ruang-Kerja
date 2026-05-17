import { getWorkspaceColumns } from "../config/constants.js";
import { renderDashboard as renderDashboardView } from "../features/dashboard/dashboard.render.js";
import { renderKanban as renderKanbanView } from "../features/kanban/kanban.render.js";
import { renderEditor } from "../features/notes/notes.render.js";
import { renderReminders as renderRemindersView } from "../features/reminders/reminders.render.js";
import { getState, selectedPage } from "../state/store.js";
import { renderSidebar as renderSidebarView } from "./sidebar.render.js";
import { renderUser } from "./user.render.js";

export function renderApp() {
  renderSidebar();
  renderDashboard();
  renderNotes();
  renderKanban();
  renderReminders();
  renderTopbar();
}

export function renderSidebar() {
  const state = getState();
  renderSidebarView({ state, pages: state.pages || [] });
}

export function renderTopbar() {
  renderUser();
}

export function renderNotes() {
  renderEditor({ page: selectedPage() });
}

export function renderDashboard() {
  const state = getState();
  renderDashboardView({ state, filteredPages: state.pages || [] });
}

export function renderKanban() {
  const state = getState();
  renderKanbanView({ pages: state.pages || [], columns: getWorkspaceColumns(state.templateId) });
}

export function renderReminders() {
  renderRemindersView({ pages: getState().pages || [] });
}

export function renderEmptyState(icon, title, subtitle, actionText = "", actionAttribute = "") {
  const action = actionText
    ? `<button class="button" ${actionAttribute}>${actionText}</button>`
    : "";

  return `
    <div class="empty-state">
      <strong>${icon ? `${icon} ` : ""}${title}</strong>
      <span>${subtitle}</span>
      ${action}
    </div>
  `;
}

export function renderSyncBadge(status) {
  renderUser({ syncStatus: status });
}

export function setActiveView(viewName) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
}
