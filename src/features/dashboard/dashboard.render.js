import { formatDate, sanitizeText, sortByUpdatedAt } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderDashboard({ state, filteredPages, setView, renderAll }) {
  const pages = state.pages || [];
  const visiblePages = typeof filteredPages === "function" ? filteredPages() : filteredPages || [];
  const doing = pages.filter((page) => page.status === "doing");
  const review = pages.filter((page) => page.status === "review");
  const reminders = pages.filter((page) => page.reminderAt && !page.reminderDone);

  if ($("dashboardTotalPages")) $("dashboardTotalPages").textContent = pages.length;
  if ($("dashboardDoingPages")) $("dashboardDoingPages").textContent = doing.length;
  if ($("dashboardReviewPages")) $("dashboardReviewPages").textContent = review.length;
  if ($("dashboardReminderPages")) $("dashboardReminderPages").textContent = reminders.length;
  if ($("heroPageCount")) $("heroPageCount").textContent = pages.length;
  if ($("heroReminderCount")) $("heroReminderCount").textContent = reminders.length;

  if ($("dashboardRecentPages")) {
    $("dashboardRecentPages").innerHTML = visiblePages.length
      ? sortByUpdatedAt(visiblePages)
          .slice(0, 5)
          .map(
            (page) => `
              <button class="dashboard-list-item" data-dashboard-page="${page.id}">
                <span class="page-dot">${sanitizeText(page.icon || "P")}</span>
                <span>
                  <strong>${sanitizeText(page.title)}</strong>
                  <small>${sanitizeText(page.status || "ideas")}</small>
                </span>
              </button>
            `,
          )
          .join("")
      : `
          <div class="empty-state">
            <strong>No pages yet.</strong>
            <span>Create your first page to start shaping the workspace.</span>
          </div>
        `;
  }

  if ($("dashboardDuePages")) {
    $("dashboardDuePages").innerHTML = reminders.length
      ? reminders
          .slice(0, 5)
          .map(
            (page) => `
              <button class="dashboard-list-item" data-dashboard-page="${page.id}">
                <span class="page-dot">${sanitizeText(page.icon || "P")}</span>
                <span>
                  <strong>${sanitizeText(page.title)}</strong>
                  <small>${formatDate(page.reminderAt)}</small>
                </span>
              </button>
            `,
          )
          .join("")
      : `
          <div class="empty-state">
            <strong>No active reminders.</strong>
            <span>Add a reminder from any note when something needs attention.</span>
          </div>
        `;
  }

  void setView;
  void renderAll;
}
