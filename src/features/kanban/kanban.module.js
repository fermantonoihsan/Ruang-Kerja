import { getWorkspaceColumns } from "../../config/constants.js";
import { getState, saveState } from "../../state/store.js";
import { getTodayISO, groupBy } from "../../utils/helpers.js";
import { renderKanban as renderKanbanView } from "./kanban.render.js";

export function renderKanban() {
  const state = getState();
  renderKanbanView({ pages: state.pages || [], columns: getWorkspaceColumns(state.templateId) });
}

export function updatePageStatus(pageId, targetStatus) {
  const page = getState().pages?.find((item) => item.id === pageId);
  if (!page) return null;

  const columns = getWorkspaceColumns(getState().templateId);
  if (!columns.some((column) => column.id === targetStatus)) return null;

  page.status = targetStatus;
  page.updatedAt = getTodayISO();
  saveState();
  return page;
}

export function initKanbanDragAndDrop() {
  return null;
}

export function getKanbanColumns(pages = []) {
  const columns = getWorkspaceColumns(getState().templateId);
  const pagesByStatus = groupBy(pages, "status");
  return columns.map((column) => ({
    ...column,
    pages: pagesByStatus[column.id] || [],
  }));
}
