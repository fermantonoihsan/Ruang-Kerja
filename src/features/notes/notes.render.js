import {
  formatDateOnly,
  getPriorityLabel,
  normalizePriority,
  renderMarkdown,
  sanitizeText,
  stringifyTags,
} from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderEditor({ page }) {
  if (!page) {
    if ($("titleInput")) $("titleInput").value = "";
    if ($("iconInput")) $("iconInput").value = "";
    if ($("tagsInput")) $("tagsInput").value = "";
    if ($("statusSelect")) $("statusSelect").value = "ideas";
    if ($("prioritySelect")) $("prioritySelect").value = "normal";
    if ($("dueDateInput")) $("dueDateInput").value = "";
    if ($("reminderInput")) $("reminderInput").value = "";
    if ($("markdownInput")) $("markdownInput").value = "";
    if ($("markdownPreview")) $("markdownPreview").innerHTML = "";
    if ($("previewTags")) $("previewTags").innerHTML = "";
    if ($("checklistList")) $("checklistList").innerHTML = "";
    if ($("linkList")) $("linkList").innerHTML = "";
    return;
  }

  if ($("titleInput")) $("titleInput").value = page.title || "";
  if ($("iconInput")) $("iconInput").value = page.icon || "";
  if ($("tagsInput")) $("tagsInput").value = stringifyTags(page.tags || []);
  if ($("statusSelect")) $("statusSelect").value = page.status || "ideas";
  if ($("prioritySelect")) $("prioritySelect").value = normalizePriority(page.priority);
  if ($("dueDateInput")) $("dueDateInput").value = page.dueDate || "";
  if ($("reminderInput")) $("reminderInput").value = page.reminderAt || "";
  if ($("markdownInput")) $("markdownInput").value = page.markdown || "";
  if ($("markdownPreview")) $("markdownPreview").innerHTML = renderMarkdown(page.markdown || "");
  if ($("previewTags")) {
    const dueDate = page.dueDate ? `<span class="due-badge">${formatDateOnly(page.dueDate)}</span>` : "";
    $("previewTags").innerHTML = [
      `<span class="priority-badge" data-priority="${normalizePriority(page.priority)}">${getPriorityLabel(page.priority)}</span>`,
      dueDate,
      ...(page.tags || []).map((tag) => `<span class="chip">#${sanitizeText(tag)}</span>`),
    ]
      .filter(Boolean)
      .join("");
  }
  renderChecklist(page);
  renderLinks(page);
}

function renderChecklist(page) {
  const checklist = Array.isArray(page.checklist) ? page.checklist : [];
  const doneCount = checklist.filter((item) => item.done).length;

  if ($("checklistProgress")) $("checklistProgress").textContent = `${doneCount}/${checklist.length} done`;
  if (!$("checklistList")) return;

  $("checklistList").innerHTML = checklist.length
    ? checklist
        .map(
          (item) => `
            <label class="checklist-item">
              <input type="checkbox" data-checklist-toggle="${sanitizeText(item.id)}" ${item.done ? "checked" : ""} />
              <span class="${item.done ? "done" : ""}">${sanitizeText(item.text)}</span>
              <button class="icon-button" type="button" data-checklist-delete="${sanitizeText(item.id)}" aria-label="Delete checklist item">
                <i data-lucide="trash-2"></i>
              </button>
            </label>
          `,
        )
        .join("")
    : `<p class="empty-state">No checklist items.</p>`;
}

function renderLinks(page) {
  const links = Array.isArray(page.links) ? page.links : [];

  if ($("linkCount")) $("linkCount").textContent = `${links.length} ${links.length === 1 ? "link" : "links"}`;
  if (!$("linkList")) return;

  $("linkList").innerHTML = links.length
    ? links
        .map(
          (link) => `
            <article class="link-item">
              <div>
                <a href="${sanitizeText(link.url)}" target="_blank" rel="noopener noreferrer">${sanitizeText(link.label || link.url)}</a>
                <small>${sanitizeText(linkTypeLabel(link.type))}</small>
              </div>
              <button class="icon-button" type="button" data-link-delete="${sanitizeText(link.id)}" aria-label="Delete link">
                <i data-lucide="trash-2"></i>
              </button>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">No links saved.</p>`;
}

function linkTypeLabel(type = "") {
  const labels = {
    "google-drive": "Google Drive",
    sharepoint: "SharePoint",
    "e-procurement": "e-procurement",
    "internal-doc": "Dokumen internal",
    spreadsheet: "Spreadsheet",
  };

  return labels[type] || "Link";
}
