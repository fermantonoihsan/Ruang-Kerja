import { formatDateOnly, getDueDateValue, getPriorityLabel, normalizePriority, sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderRfqTracker({ pages, columns, onOpenPage, onMoveRfq }) {
  const items = (pages || []).filter((page) => page.rfqStatus);

  if ($("rfqMeta")) {
    $("rfqMeta").textContent = `${items.length} ${items.length === 1 ? "RFQ item" : "RFQ items"}`;
  }

  if (!$("rfqBoard")) return;

  $("rfqBoard").innerHTML = columns
    .map((column) => {
      const columnItems = items.filter((page) => page.rfqStatus === column.id);

      return `
        <section class="kanban-column rfq-column">
          <div class="kanban-column-header">
            <strong>${sanitizeText(column.title)}</strong>
            <span>${columnItems.length}</span>
          </div>
          <div class="kanban-column-body" data-rfq-drop-status="${column.id}">
            ${
              columnItems.length
                ? columnItems
                    .map(
                      (page) => `
                        <article class="kanban-card rfq-card" draggable="true" data-open-rfq="${page.id}" data-drag-rfq="${page.id}">
                          <strong>${sanitizeText(page.icon || "R")} ${sanitizeText(page.title)}</strong>
                          <div class="card-meta-row">
                            <span class="priority-badge" data-priority="${normalizePriority(page.priority)}">${getPriorityLabel(page.priority)}</span>
                            ${
                              getDueDateValue(page)
                                ? `<span class="due-badge">Due ${formatDateOnly(getDueDateValue(page))}</span>`
                                : ""
                            }
                          </div>
                          <p>${sanitizeText(getRfqSummary(page))}</p>
                          <small>${(page.supplierBids || []).length} supplier bid(s)</small>
                          <div class="rfq-card-tags">
                            ${(page.tags || []).slice(0, 3).map((tag) => `<span>#${sanitizeText(tag)}</span>`).join("")}
                          </div>
                        </article>
                      `,
                    )
                    .join("")
                : `<p class="empty-state">No RFQ items.</p>`
            }
          </div>
        </section>
      `;
    })
    .join("");

  $("rfqBoard").querySelectorAll("[data-open-rfq]").forEach((card) => {
    card.addEventListener("click", () => {
      if (card.dataset.wasDragged === "true") {
        card.dataset.wasDragged = "false";
        return;
      }

      onOpenPage?.(card.dataset.openRfq);
    });
  });

  $("rfqBoard").querySelectorAll("[data-drag-rfq]").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      card.classList.add("dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", card.dataset.dragRfq);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      card.dataset.wasDragged = "true";
      window.setTimeout(() => {
        card.dataset.wasDragged = "false";
      }, 0);
    });
  });

  $("rfqBoard").querySelectorAll("[data-rfq-drop-status]").forEach((dropZone) => {
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
      const targetStatus = dropZone.dataset.rfqDropStatus;
      if (!pageId || !targetStatus) return;

      onMoveRfq?.(pageId, targetStatus);
    });
  });
}

function getRfqSummary(page) {
  const cleanMarkdown = (page.markdown || "")
    .replaceAll("#", "")
    .replace(/\[[ x]\]/gi, "")
    .trim();

  return cleanMarkdown.slice(0, 120) || "Track RFQ owner, vendor response, quotation, approval, PO, and delivery.";
}
