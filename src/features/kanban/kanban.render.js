import { sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderKanban({ pages, columns, onOpenPage }) {
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
          <div class="kanban-column-body">
            ${
              items.length
                ? items
                    .map(
                      (page) => `
                        <article class="kanban-card" data-open-page="${page.id}">
                          <strong>${sanitizeText(page.icon || "P")} ${sanitizeText(page.title)}</strong>
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
      onOpenPage?.(card.dataset.openPage);
    });
  });
}
