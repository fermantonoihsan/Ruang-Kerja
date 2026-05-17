import { sanitizeText } from "../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderSidebar({ state, pages, onSelectPage }) {
  if ($("workspaceName")) $("workspaceName").textContent = state.workspaceName || "My Workspace";
  if ($("pageCount")) $("pageCount").textContent = pages.length;

  if ($("pageList")) {
    $("pageList").innerHTML = pages
      .map(
        (page) => `
          <button class="page-item ${page.id === state.selectedPageId ? "active" : ""}" data-page-id="${page.id}">
            <span>${sanitizeText(page.icon || "P")}</span>
            <strong>${sanitizeText(page.title)}</strong>
          </button>
        `,
      )
      .join("");

    $("pageList").querySelectorAll("[data-page-id]").forEach((button) => {
      button.addEventListener("click", () => {
        onSelectPage?.(button.dataset.pageId);
      });
    });
  }

  if ($("tagCloud")) {
    const tags = [...new Set((state.pages || []).flatMap((page) => page.tags || []))];

    $("tagCloud").innerHTML = tags.length
      ? tags.map((tag) => `<span class="chip">#${sanitizeText(tag)}</span>`).join("")
      : `<span class="muted">No tags yet</span>`;
  }
}
