import { formatDate, sanitizeText, sortByUpdatedAt } from "../../utils/helpers.js";
import { dashboardProfiles } from "../../config/templates.js";

const $ = (id) => document.getElementById(id);

export function renderDashboard({ state, filteredPages, setView, renderAll }) {
  const pages = state.pages || [];
  const visiblePages = typeof filteredPages === "function" ? filteredPages() : filteredPages || [];
  const doing = pages.filter((page) => page.status === "doing");
  const review = pages.filter((page) => page.status === "review");
  const reminders = pages.filter((page) => page.reminderAt && !page.reminderDone);
  const profile = dashboardProfiles[state.templateId] || dashboardProfiles.default;

  renderDashboardProfile(profile, pages, reminders);
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

function renderDashboardProfile(profile, pages, reminders) {
  if ($("dashboardEyebrow")) $("dashboardEyebrow").textContent = profile.eyebrow;
  if ($("dashboardHeroTitle")) $("dashboardHeroTitle").textContent = profile.title;
  if ($("dashboardHeroDescription")) $("dashboardHeroDescription").textContent = profile.description;
  if ($("dashboardStatusLabel")) $("dashboardStatusLabel").textContent = profile.statusLabel;
  if ($("dashboardStatusTitle")) $("dashboardStatusTitle").textContent = profile.statusTitle;
  if ($("dashboardStatusDescription")) $("dashboardStatusDescription").textContent = profile.statusDescription;
  if ($("dashboardRecentTitle")) $("dashboardRecentTitle").textContent = profile.recentTitle;
  if ($("dashboardRecentSubtitle")) $("dashboardRecentSubtitle").textContent = profile.recentSubtitle;
  if ($("dashboardDueTitle")) $("dashboardDueTitle").textContent = profile.dueTitle;
  if ($("dashboardDueSubtitle")) $("dashboardDueSubtitle").textContent = profile.dueSubtitle;

  if ($("dashboardCapabilities")) {
    $("dashboardCapabilities").innerHTML = profile.capabilities
      .map((capability) => `<span>${sanitizeText(capability)}</span>`)
      .join("");
  }

  profile.metrics.forEach((metric, index) => {
    const number = index + 1;
    if ($(`dashboardMetricLabel${number}`)) {
      $(`dashboardMetricLabel${number}`).textContent = metric.label;
    }

    if ($(`dashboardMetricValue${number}`)) {
      $(`dashboardMetricValue${number}`).textContent = getMetricValue(metric.value, pages, reminders);
    }
  });
}

function getMetricValue(metricValue, pages, reminders) {
  if (metricValue === "pages") return pages.length;
  if (metricValue === "reminders") return reminders.length;

  if (metricValue.startsWith("status:")) {
    const status = metricValue.replace("status:", "");
    return pages.filter((page) => page.status === status).length;
  }

  if (metricValue.startsWith("tag:")) {
    const tag = metricValue.replace("tag:", "");
    return pages.filter((page) => (page.tags || []).includes(tag)).length;
  }

  if (metricValue.startsWith("completedThisWeek:")) {
    const status = metricValue.replace("completedThisWeek:", "");
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return pages.filter((page) => {
      if (page.status !== status) return false;
      const updatedAt = page.updatedAt ? new Date(page.updatedAt) : null;
      return updatedAt && !Number.isNaN(updatedAt.getTime()) && updatedAt >= weekAgo;
    }).length;
  }

  if (metricValue.startsWith("rfq:")) {
    const rfqStatus = metricValue.replace("rfq:", "");
    if (rfqStatus === "any") return pages.filter((page) => page.rfqStatus).length;
    return pages.filter((page) => page.rfqStatus === rfqStatus).length;
  }

  if (metricValue.startsWith("bids:")) {
    const bidMetric = metricValue.replace("bids:", "");
    const bids = pages.flatMap((page) => page.supplierBids || []);
    if (bidMetric === "any") return bids.length;
    if (bidMetric === "vendors") return new Set(bids.map((bid) => bid.vendorName).filter(Boolean)).size;
  }

  return 0;
}
