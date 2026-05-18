import {
  formatDate,
  formatDateOnly,
  getDueDateValue,
  getPriorityLabel,
  normalizePriority,
  parseDateOnly,
  sanitizeText,
} from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderReminders({ pages }) {
  const reminders = pages
    .filter((page) => getDueDateValue(page) && !page.reminderDone)
    .sort((a, b) => parseDateOnly(getDueDateValue(a)) - parseDateOnly(getDueDateValue(b)));
  const groups = groupReminders(reminders);

  if ($("reminderMeta")) {
    $("reminderMeta").textContent = reminders.length
      ? `${reminders.length} ${reminders.length === 1 ? "reminder" : "reminders"}`
      : "No reminders";
  }

  if (!$("reminderList")) return;

  $("reminderList").innerHTML = reminders.length
    ? [
        renderReminderGroup("Overdue", groups.overdue),
        renderReminderGroup("Today", groups.today),
        renderReminderGroup("This Week", groups.thisWeek),
        renderReminderGroup("Later", groups.later),
      ].join("")
    : `<p class="empty-state">No reminders yet.</p>`;
}

function renderReminderGroup(title, reminders) {
  return `
    <section class="reminder-group">
      <div class="reminder-group-header">
        <h2>${sanitizeText(title)}</h2>
        <span>${reminders.length}</span>
      </div>
      <div class="reminder-group-list">
        ${
          reminders.length
            ? reminders.map(renderReminderItem).join("")
            : `<p class="empty-state">No ${sanitizeText(title.toLowerCase())} reminders.</p>`
        }
      </div>
    </section>
  `;
}

function renderReminderItem(page) {
  const dueDate = getDueDateValue(page);
  return `
    <article class="reminder-item">
      <div>
        <strong>${sanitizeText(page.title)}</strong>
        <div class="card-meta-row">
          <span class="priority-badge" data-priority="${normalizePriority(page.priority)}">${getPriorityLabel(page.priority)}</span>
          <span class="due-badge">Due ${formatDateOnly(dueDate)}</span>
          ${page.reminderAt ? `<span class="due-badge">Reminder ${formatDate(page.reminderAt)}</span>` : ""}
        </div>
      </div>
      <span>${sanitizeText((page.tags || []).slice(0, 2).join(", ") || page.status || "page")}</span>
    </article>
  `;
}

function groupReminders(reminders) {
  const today = startOfDay(new Date());
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);

  return reminders.reduce(
    (groups, page) => {
      const dueDate = parseDateOnly(getDueDateValue(page));
      if (!dueDate) return groups;

      if (dueDate < today) {
        groups.overdue.push(page);
      } else if (dueDate.getTime() === today.getTime()) {
        groups.today.push(page);
      } else if (dueDate <= weekEnd) {
        groups.thisWeek.push(page);
      } else {
        groups.later.push(page);
      }

      return groups;
    },
    { overdue: [], today: [], thisWeek: [], later: [] },
  );
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
