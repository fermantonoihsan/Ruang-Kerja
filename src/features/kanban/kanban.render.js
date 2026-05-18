import { formatDateOnly, getDueDateValue, getPriorityLabel, normalizePriority, sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderKanban({ pages, columns, onOpenPage, onMovePage }) {
  if ($("kanbanMeta")) $("kanbanMeta").textContent = `${pages.length} ${pages.length === 1 ? "card" : "cards"}`;

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
          <div class="kanban-column-body" data-drop-status="${column.id}">
            ${
              items.length
                ? items
                    .map(
                      (page) => `
                        <article class="kanban-card" draggable="true" data-open-page="${page.id}" data-drag-page="${page.id}">
                          <strong>${sanitizeText(page.icon || "P")} ${sanitizeText(page.title)}</strong>
                          <div class="card-meta-row">
                            <span class="priority-badge" data-priority="${normalizePriority(page.priority)}">${getPriorityLabel(page.priority)}</span>
                            ${
                              getDueDateValue(page)
                                ? `<span class="due-badge">Due ${formatDateOnly(getDueDateValue(page))}</span>`
                                : ""
                            }
                          </div>
                          <p>${sanitizeText((page.markdown || "").replaceAll("#", "").slice(0, 90))}</p>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="empty-state">No cards yet.</p>`
            }
          </div>
        </section>
      `;
    })
    .join("");

  $("kanbanBoard").querySelectorAll("[data-open-page]").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.dataset.wasDragged === "true") {
        card.dataset.wasDragged = "false";
        return;
      }

      onOpenPage?.(card.dataset.openPage);
    });
  });

  $("kanbanBoard").querySelectorAll("[data-drag-page]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.dragPage);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      card.dataset.wasDragged = "true";
      window.setTimeout(() => {
        card.dataset.wasDragged = "false";
      }, 0);
    });
  });

  $("kanbanBoard").querySelectorAll("[data-drop-status]").forEach((dropZone) => {
    const column = dropZone.closest(".kanban-column");

    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      column?.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", (event) => {
      if (!dropZone.contains(event.relatedTarget)) {
        column?.classList.remove("drag-over");
      }
    });

    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      column?.classList.remove("drag-over");

      const pageId = event.dataTransfer.getData("text/plain");
      const targetStatus = dropZone.dataset.dropStatus;
      if (!pageId || !targetStatus) return;

      onMovePage?.(pageId, targetStatus);
    });
  });
}
