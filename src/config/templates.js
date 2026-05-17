import { generateId, getTodayISO } from "../utils/helpers.js";

const templateDefinitions = {
  procurement: {
    id: "procurement",
    label: "Procurement",
    workspaceName: "Procurement Workspace",
    displayName: "Procurement Staff",
    description: "Track vendors, RFQs, purchase orders, deliveries, and contract follow-ups.",
    pages: [
      {
        title: "RFQ Follow-up - Vendor Comparison",
        icon: "R",
        status: "doing",
        tags: ["rfq", "vendor", "urgent"],
        markdown:
          "# RFQ Follow-up - Vendor Comparison\n\n## Vendors\n- Vendor A: waiting quotation\n- Vendor B: quotation received\n- Vendor C: technical clarification\n\n## Checklist\n- [ ] Compare price and lead time\n- [ ] Validate technical compliance\n- [ ] Prepare negotiation notes\n- [ ] Submit recommendation for approval",
      },
      {
        title: "PO Delivery Tracker",
        icon: "P",
        status: "review",
        tags: ["po", "delivery", "follow-up"],
        markdown:
          "# PO Delivery Tracker\n\nTrack purchase order delivery status, ETA, receiving confirmation, and blockers.\n\n## Pending Items\n- PO number:\n- Vendor:\n- Expected delivery:\n- Warehouse confirmation:\n- Issue/risk:",
      },
      {
        title: "Vendor Evaluation Notes",
        icon: "V",
        status: "ideas",
        tags: ["vendor", "evaluation"],
        markdown:
          "# Vendor Evaluation Notes\n\n## Evaluation Criteria\n- Price competitiveness\n- Delivery reliability\n- Document completeness\n- Service responsiveness\n- Safety/compliance record",
      },
      {
        title: "Contract Renewal Reminder",
        icon: "C",
        status: "ideas",
        tags: ["contract", "renewal"],
        markdown:
          "# Contract Renewal Reminder\n\nUse this page to track agreement expiry, renewal owner, supporting documents, and approval path.",
      },
    ],
  },
  staff: {
    id: "staff",
    label: "Office Staff",
    workspaceName: "Staff Daily Workspace",
    displayName: "Office Staff",
    description: "Organize daily administration, meeting notes, document follow-ups, and reminders.",
    pages: [
      {
        title: "Daily Task Inbox",
        icon: "D",
        status: "doing",
        tags: ["daily", "admin", "follow-up"],
        markdown:
          "# Daily Task Inbox\n\n## Today\n- [ ] Check incoming requests\n- [ ] Update document status\n- [ ] Follow up pending approvals\n- [ ] Prepare end-of-day notes",
      },
      {
        title: "Meeting Notes",
        icon: "M",
        status: "ideas",
        tags: ["meeting", "notes"],
        markdown:
          "# Meeting Notes\n\n## Agenda\n-\n\n## Decisions\n-\n\n## Action Items\n- Owner:\n- Deadline:\n- Follow-up:",
      },
      {
        title: "Document Follow-up",
        icon: "F",
        status: "review",
        tags: ["document", "review"],
        markdown:
          "# Document Follow-up\n\nTrack documents that need review, signature, distribution, or archive.\n\n## Pending\n- Document name:\n- Current owner:\n- Next action:\n- Due date:",
      },
      {
        title: "Weekly Report Draft",
        icon: "W",
        status: "ideas",
        tags: ["report", "weekly"],
        markdown:
          "# Weekly Report Draft\n\n## Highlights\n-\n\n## Completed\n-\n\n## Blockers\n-\n\n## Next Week\n-",
      },
    ],
  },
  manager: {
    id: "manager",
    label: "Manager",
    workspaceName: "Manager Command Center",
    displayName: "Manager",
    description: "Monitor programs, decisions, reviews, deadlines, and cross-team execution.",
    pages: [
      {
        title: "Program Monitoring Dashboard",
        icon: "P",
        status: "doing",
        tags: ["program", "monitoring", "priority"],
        markdown:
          "# Program Monitoring Dashboard\n\n## Active Programs\n- Program:\n- Owner:\n- Current status:\n- Risk:\n- Next decision:\n\n## This Week Focus\n- [ ] Review progress\n- [ ] Clear blockers\n- [ ] Confirm next milestones",
      },
      {
        title: "Leadership Meeting Notes",
        icon: "L",
        status: "review",
        tags: ["meeting", "decision"],
        markdown:
          "# Leadership Meeting Notes\n\n## Key Decisions\n-\n\n## Follow-ups\n- PIC:\n- Deadline:\n- Status:\n\n## Items for Review\n-",
      },
      {
        title: "Report Review Queue",
        icon: "R",
        status: "review",
        tags: ["report", "review"],
        markdown:
          "# Report Review Queue\n\nTrack reports that need leadership review before submission/publication.\n\n## Review Checklist\n- [ ] Data consistency\n- [ ] Narrative clarity\n- [ ] Approval readiness\n- [ ] Submission deadline",
      },
      {
        title: "Strategic Issues Log",
        icon: "S",
        status: "ideas",
        tags: ["issue", "strategy"],
        markdown:
          "# Strategic Issues Log\n\nUse this page for important issues that need monitoring, escalation, or decision.\n\n## Issue\n-\n\n## Impact\n-\n\n## Recommended action\n-",
      },
    ],
  },
};

export const workspaceTemplates = Object.values(templateDefinitions);

export const dashboardProfiles = {
  procurement: {
    eyebrow: "Procurement Workspace",
    title: "Track vendors, RFQs, purchase orders, and delivery risks.",
    description:
      "Monitor procurement flow from request to vendor follow-up, review, and delivery so urgent items stay visible.",
    capabilities: ["RFQ", "Vendor", "PO", "Delivery"],
    statusLabel: "Procurement Pulse",
    statusTitle: "Keep sourcing work moving.",
    statusDescription: "Use the board to move items from RFQ and negotiation into review, PO, and delivery follow-up.",
    metrics: [
      { label: "Open Items", value: "pages" },
      { label: "Vendor Follow-ups", value: "tag:vendor" },
      { label: "Under Review", value: "status:review" },
      { label: "Due Alerts", value: "reminders" },
    ],
    recentTitle: "Procurement Queue",
    recentSubtitle: "Latest sourcing work",
    dueTitle: "Follow-up Deadlines",
    dueSubtitle: "RFQ, PO, delivery, contract",
  },
  staff: {
    eyebrow: "Office Staff Workspace",
    title: "Organize daily admin, documents, meetings, and follow-ups.",
    description:
      "Keep daily work visible with a simple operating board for tasks, notes, document status, and weekly reporting.",
    capabilities: ["Daily Tasks", "Meetings", "Documents", "Reports"],
    statusLabel: "Daily Workload",
    statusTitle: "Stay clear on today’s work.",
    statusDescription: "Capture requests, track document progress, and prepare reports without losing small follow-ups.",
    metrics: [
      { label: "Total Tasks", value: "pages" },
      { label: "In Progress", value: "status:doing" },
      { label: "Documents", value: "tag:document" },
      { label: "Reminders", value: "reminders" },
    ],
    recentTitle: "Daily Queue",
    recentSubtitle: "Recently updated",
    dueTitle: "Today & Upcoming",
    dueSubtitle: "Reminders and follow-ups",
  },
  manager: {
    eyebrow: "Manager Command Center",
    title: "Monitor programs, reviews, decisions, and strategic issues.",
    description:
      "A leadership dashboard for tracking execution, review queues, reporting priorities, and decisions across teams.",
    capabilities: ["Programs", "Reviews", "Decisions", "Issues"],
    statusLabel: "Leadership Focus",
    statusTitle: "See what needs decision.",
    statusDescription: "Use review and reminder signals to keep programs, reports, and escalations moving.",
    metrics: [
      { label: "Programs", value: "tag:program" },
      { label: "Review Queue", value: "status:review" },
      { label: "Decision Notes", value: "tag:decision" },
      { label: "Due Alerts", value: "reminders" },
    ],
    recentTitle: "Executive Queue",
    recentSubtitle: "Latest priorities",
    dueTitle: "Decision Deadlines",
    dueSubtitle: "Items needing attention",
  },
  default: {
    eyebrow: "Atlas Workspace",
    title: "Organize work, ideas, and execution in one calm system.",
    description:
      "A local-first productivity workspace for structured notes, draggable Kanban planning, and reminders that keep daily execution clear.",
    capabilities: ["Notes", "Kanban", "Reminders", "Offline-first"],
    statusLabel: "Workspace Status",
    statusTitle: "Build your operating rhythm.",
    statusDescription: "Start locally, then sign in when you need secure Firebase sync across devices.",
    metrics: [
      { label: "Total Pages", value: "pages" },
      { label: "In Progress", value: "status:doing" },
      { label: "Review", value: "status:review" },
      { label: "Reminders", value: "reminders" },
    ],
    recentTitle: "Recent Pages",
    recentSubtitle: "Last updated",
    dueTitle: "Due Soon",
    dueSubtitle: "Active reminders",
  },
};

export function createWorkspaceFromTemplate(templateId) {
  const template = templateDefinitions[templateId] || templateDefinitions.staff;
  const now = getTodayISO();
  const pages = template.pages.map((page) => ({
    id: generateId("page"),
    title: page.title,
    icon: page.icon,
    status: page.status,
    tags: page.tags,
    markdown: page.markdown,
    reminderAt: "",
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
  }));

  return {
    templateId: template.id,
    workspaceName: template.workspaceName,
    displayName: template.displayName,
    preferences: {
      pageZoom: 100,
      compactMode: false,
      focusCards: false,
    },
    selectedPageId: pages[0]?.id || "",
    pages,
    updatedAt: now,
  };
}
