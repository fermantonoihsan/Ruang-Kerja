import { formatDate, sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderReminders({ pages }) {
  const reminders = pages.filter((page) => page.reminderAt && !page.reminderDone);

  if ($("reminderMeta")) {
    $("reminderMeta").textContent = reminders.length
      ? `${reminders.length} ${reminders.length === 1 ? "reminder" : "reminders"}`
      : "No reminders";
  }

  if (!$("reminderList")) return;

  $("reminderList").innerHTML = reminders.length
    ? reminders
        .map(
          (page) => `
            <article class="reminder-item">
              <strong>${sanitizeText(page.title)}</strong>
              <span>${formatDate(page.reminderAt)}</span>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">No reminders yet.</p>`;
}
