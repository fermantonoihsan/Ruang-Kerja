import {
  formatDate,
  formatDateOnly,
  getDueDateValue,
  getPriorityLabel,
  isDueSoon,
  normalizePriority,
  sanitizeText,
  sortByUpdatedAt,
} from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export const procurementCategories = ["chemical", "sparepart", "service", "urgent", "vendor-a", "capex", "opex"];

export const procurementReminderLabels = {
  "quotation-deadline": "Deadline quotation",
  "expired-contract": "Expired contract",
  "delivery-schedule": "Jadwal delivery",
  "vendor-evaluation": "Vendor evaluation",
  "renewal-agreement": "Renewal agreement",
};

export const procurementNoteTemplates = [
  {
    id: "rfq-summary",
    title: "RFQ Summary",
    icon: "R",
    rfqStatus: "request",
    tags: ["procurement", "rfq", "quotation-deadline"],
    markdown:
      "# RFQ Summary\n\n## Request\n- PR Number:\n- Item / Service:\n- Category:\n- Requester:\n- Required date:\n\n## Vendors\n- Vendor A:\n- Vendor B:\n- Vendor C:\n\n## Status\n- Current stage: Request\n- Pending document:\n- Next follow-up:\n- PIC:",
  },
  {
    id: "vendor-comparison",
    title: "Vendor Comparison",
    icon: "V",
    rfqStatus: "quotation",
    tags: ["procurement", "vendor-comparison", "vendor-evaluation"],
    markdown:
      "# Vendor Comparison\n\n| Vendor | PIC | Contact | Price | Lead Time | Compliance | Notes |\n| --- | --- | --- | ---: | --- | --- | --- |\n| Vendor A |  |  |  |  |  |  |\n| Vendor B |  |  |  |  |  |  |\n| Vendor C |  |  |  |  |  |  |\n\n## Recommendation\n-\n\n## Negotiation Notes\n-",
  },
  {
    id: "meeting-minutes",
    title: "Procurement Meeting Minutes",
    icon: "M",
    rfqStatus: "negotiation",
    tags: ["procurement", "meeting-minutes"],
    markdown:
      "# Procurement Meeting Minutes\n\n## Agenda\n-\n\n## Participants\n-\n\n## Vendor / Item Discussed\n-\n\n## Decisions\n-\n\n## Action Items\n- PIC:\n- Deadline:\n- Follow-up:",
  },
  {
    id: "issue-log",
    title: "Procurement Issue Log",
    icon: "I",
    rfqStatus: "negotiation",
    tags: ["procurement", "issue-log", "urgent"],
    markdown:
      "# Procurement Issue Log\n\n## Issue\n-\n\n## Impact\n-\n\n## Vendor / PO / Contract\n-\n\n## Current Owner\n-\n\n## Mitigation\n- [ ] Confirm facts\n- [ ] Escalate blocker\n- [ ] Update requester\n- [ ] Close issue",
  },
  {
    id: "approval-checklist",
    title: "Approval Checklist",
    icon: "A",
    rfqStatus: "negotiation",
    tags: ["procurement", "approval-checklist"],
    markdown:
      "# Approval Checklist\n\n## Package\n- PR / RFQ / PO Number:\n- Item / Service:\n- Budget type: CAPEX / OPEX\n\n## Checklist\n- [ ] RFQ summary complete\n- [ ] Vendor comparison attached\n- [ ] Technical compliance confirmed\n- [ ] Commercial negotiation recorded\n- [ ] Budget approval ready\n- [ ] PO draft reviewed",
  },
];

export function getProcurementReminderLabel(type) {
  return procurementReminderLabels[type] || "Procurement reminder";
}

export function renderProcurementDashboard({ state, onOpenPage }) {
  const pages = getProcurementPages(state);
  const today = new Date().toISOString().slice(0, 10);
  const poPending = pages.filter((page) => page.rfqStatus === "po-issued");
  const quotationDueSoon = pages.filter(
    (page) => hasAnyTag(page, ["quotation-deadline", "rfq"]) && isDueSoon(page.reminderAt, 7),
  );
  const vendorFollowUpToday = pages.filter(
    (page) => hasAnyTag(page, ["vendor-follow-up", "vendor-evaluation"]) && String(page.reminderAt || "").slice(0, 10) === today,
  );
  const urgentItems = pages.filter((page) => hasAnyTag(page, ["urgent"]));

  setText("procurementMetricPoPending", poPending.length);
  setText("procurementMetricQuotationDue", quotationDueSoon.length);
  setText("procurementMetricVendorToday", vendorFollowUpToday.length);
  setText("procurementMetricUrgent", urgentItems.length);

  renderDashboardList("procurementPoPendingList", poPending, "No pending PO items.", onOpenPage);
  renderDashboardList("procurementQuotationDueList", quotationDueSoon, "No quotation deadlines due soon.", onOpenPage);
  renderDashboardList("procurementVendorTodayList", vendorFollowUpToday, "No vendor follow-up scheduled today.", onOpenPage);
  renderDashboardList("procurementUrgentList", urgentItems, "No urgent procurement items.", onOpenPage);
}

export function renderVendorTracker({ state, onOpenPage }) {
  const vendors = collectVendors(state);

  if ($("vendorTrackerMeta")) {
    $("vendorTrackerMeta").textContent = `${vendors.length} ${vendors.length === 1 ? "vendor" : "vendors"}`;
  }

  if (!$("vendorTrackerList")) return;

  $("vendorTrackerList").innerHTML = vendors.length
    ? vendors.map((vendor) => renderVendorCard(vendor)).join("")
    : `<div class="empty-state"><strong>No vendors yet.</strong><span>Add a vendor follow-up page to start tracking.</span></div>`;

  bindPageButtons($("vendorTrackerList"), onOpenPage);
}

export function renderProcurementReminders({ state, onOpenPage }) {
  const reminders = getProcurementPages(state)
    .filter((page) => page.reminderAt && !page.reminderDone && hasAnyTag(page, Object.keys(procurementReminderLabels)))
    .sort((a, b) => new Date(a.reminderAt) - new Date(b.reminderAt));

  if ($("procurementReminderMeta")) {
    $("procurementReminderMeta").textContent = `${reminders.length} active procurement reminder(s)`;
  }

  if (!$("procurementReminderList")) return;

  $("procurementReminderList").innerHTML = reminders.length
    ? reminders.map((page) => renderReminderCard(page)).join("")
    : `<div class="empty-state"><strong>No procurement reminders.</strong><span>Add quotation, contract, delivery, evaluation, or renewal reminders here.</span></div>`;

  bindPageButtons($("procurementReminderList"), onOpenPage);
}

export function renderProcurementTemplates({ onCreateTemplate }) {
  if ($("procurementCategoryTags")) {
    $("procurementCategoryTags").innerHTML = procurementCategories
      .map((tag) => `<span class="chip">#${sanitizeText(tag)}</span>`)
      .join("");
  }

  if (!$("procurementTemplateList")) return;

  $("procurementTemplateList").innerHTML = procurementNoteTemplates
    .map(
      (template) => `
        <article class="procurement-card">
          <div>
            <span class="procurement-kicker">Template</span>
            <strong>${sanitizeText(template.title)}</strong>
            <small>${template.tags.map((tag) => `#${sanitizeText(tag)}`).join(" ")}</small>
          </div>
          <button class="button" type="button" data-procurement-template="${template.id}">
            <i data-lucide="plus"></i>
            <span>Create Note</span>
          </button>
        </article>
      `,
    )
    .join("");

  $("procurementTemplateList").querySelectorAll("[data-procurement-template]").forEach((button) => {
    button.addEventListener("click", () => {
      onCreateTemplate?.(button.dataset.procurementTemplate);
    });
  });
}

function renderVendorCard(vendor) {
  return `
    <article class="procurement-card">
      <div>
        <span class="procurement-kicker">${sanitizeText(vendor.offerStatus || "Follow-up")}</span>
        <strong>${sanitizeText(vendor.vendorName)}</strong>
        <small>${sanitizeText(vendor.pic || "PIC belum diisi")} | ${sanitizeText(vendor.contact || "Kontak belum diisi")}</small>
      </div>
      <dl class="procurement-detail-grid">
        <div><dt>Dokumen pending</dt><dd>${sanitizeText(vendor.docsPending || "-")}</dd></div>
        <div><dt>Catatan negosiasi</dt><dd>${sanitizeText(vendor.negotiationNotes || "-")}</dd></div>
      </dl>
      <div class="rfq-card-tags">
        ${(vendor.tags || []).slice(0, 6).map((tag) => `<span>#${sanitizeText(tag)}</span>`).join("")}
      </div>
      ${vendor.pageId ? `<button class="button button-light" type="button" data-procurement-page="${vendor.pageId}">Open Page</button>` : ""}
    </article>
  `;
}

function renderReminderCard(page) {
  return `
    <article class="reminder-card ${isDueSoon(page.reminderAt, 2) ? "due" : ""}">
      <div>
        <strong>${sanitizeText(page.title)}</strong>
        <span>${sanitizeText(getReminderType(page))} | ${formatDate(page.reminderAt)}</span>
        <div class="card-meta-row">
          <span class="priority-badge" data-priority="${normalizePriority(page.priority)}">${getPriorityLabel(page.priority)}</span>
          ${
            getDueDateValue(page)
              ? `<span class="due-badge">Due ${formatDateOnly(getDueDateValue(page))}</span>`
              : ""
          }
        </div>
        <div class="rfq-card-tags">
          ${(page.tags || []).slice(0, 6).map((tag) => `<span>#${sanitizeText(tag)}</span>`).join("")}
        </div>
      </div>
      <button class="button button-light" type="button" data-procurement-page="${page.id}">Open</button>
    </article>
  `;
}

function renderDashboardList(elementId, pages, emptyText, onOpenPage) {
  const element = $(elementId);
  if (!element) return;

  element.innerHTML = pages.length
    ? sortByUpdatedAt(pages)
        .slice(0, 6)
        .map(
          (page) => `
            <button class="dashboard-list-item" data-procurement-page="${page.id}">
              <span class="page-dot">${sanitizeText(page.icon || "P")}</span>
              <span>
                <strong>${sanitizeText(page.title)}</strong>
                <small>${sanitizeText(page.rfqStatus || (page.tags || []).slice(0, 2).join(", ") || "procurement")}</small>
              </span>
            </button>
          `,
        )
        .join("")
    : `<div class="empty-state"><span>${sanitizeText(emptyText)}</span></div>`;

  bindPageButtons(element, onOpenPage);
}

function collectVendors(state = {}) {
  const vendorPages = (state.pages || [])
    .filter((page) => page.vendorFollowUp || hasAnyTag(page, ["vendor-follow-up"]))
    .map((page) => ({
      pageId: page.id,
      vendorName: page.vendorFollowUp?.vendorName || page.title.replace(/^Vendor Follow-up\s*-\s*/i, ""),
      pic: page.vendorFollowUp?.pic || "",
      contact: page.vendorFollowUp?.contact || "",
      offerStatus: page.vendorFollowUp?.offerStatus || page.rfqStatus || "Follow-up",
      docsPending: page.vendorFollowUp?.docsPending || "",
      negotiationNotes: page.vendorFollowUp?.negotiationNotes || "",
      tags: page.tags || [],
      updatedAt: page.updatedAt,
    }));

  const bidVendors = (state.pages || []).flatMap((page) =>
    (page.supplierBids || []).map((bid) => ({
      pageId: page.id,
      vendorName: bid.vendorName || "Unnamed vendor",
      pic: bid.vendorContact || "",
      contact: bid.vendorContact || "",
      offerStatus: bid.bidStatus || page.rfqStatus || "Quotation",
      docsPending: bid.technicalCompliance || "",
      negotiationNotes: bid.recommendation || "",
      tags: page.tags || [],
      updatedAt: page.updatedAt,
    })),
  );

  const merged = new Map();
  [...vendorPages, ...bidVendors].forEach((vendor) => {
    const key = vendor.vendorName.toLowerCase();
    const current = merged.get(key);
    if (!current) {
      merged.set(key, vendor);
      return;
    }

    merged.set(key, {
      ...current,
      ...Object.fromEntries(Object.entries(vendor).filter(([, value]) => value)),
      tags: [...new Set([...(current.tags || []), ...(vendor.tags || [])])],
    });
  });

  return sortByUpdatedAt([...merged.values()]);
}

function getProcurementPages(state = {}) {
  return (state.pages || []).filter(
    (page) =>
      page.rfqStatus ||
      hasAnyTag(page, [
        "procurement",
        "rfq",
        "vendor-follow-up",
        "quotation-deadline",
        "expired-contract",
        "delivery-schedule",
        "vendor-evaluation",
        "renewal-agreement",
      ]),
  );
}

function getReminderType(page) {
  const tags = new Set((page.tags || []).map((tag) => String(tag).toLowerCase()));
  return Object.keys(procurementReminderLabels)
    .map((type) => (tags.has(type) ? procurementReminderLabels[type] : ""))
    .find(Boolean) || "Procurement reminder";
}

function bindPageButtons(root, onOpenPage) {
  root?.querySelectorAll("[data-procurement-page]").forEach((button) => {
    button.addEventListener("click", () => {
      onOpenPage?.(button.dataset.procurementPage);
    });
  });
}

function hasAnyTag(page, tags) {
  const pageTags = new Set((page.tags || []).map((tag) => String(tag).toLowerCase()));
  return tags.some((tag) => pageTags.has(tag));
}

function setText(id, value) {
  if ($(id)) $(id).textContent = value;
}
