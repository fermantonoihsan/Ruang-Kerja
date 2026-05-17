import { formatDate, sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function getLeadershipState(state = {}) {
  return {
    decisions: [],
    meetings: [],
    ...(state.bpsLeadership || {}),
  };
}

export function renderDecisionRegister({ state, onRemoveDecision, onStatusChange, onCreatePage }) {
  const leadership = getLeadershipState(state);
  const decisions = leadership.decisions || [];
  const openDecisions = decisions.filter((decision) => decision.status !== "closed");
  const dueDecisions = decisions.filter((decision) => decision.deadline && decision.status !== "closed");
  const highImpact = decisions.filter((decision) => decision.impact === "high" || decision.impact === "critical");

  setText("decisionTotal", decisions.length);
  setText("decisionOpen", openDecisions.length);
  setText("decisionDue", dueDecisions.length);
  setText("decisionHighImpact", highImpact.length);

  const list = $("decisionRegisterList");
  if (!list) return;

  list.innerHTML = decisions.length
    ? decisions
        .map(
          (decision) => `
            <article class="leadership-item">
              <div class="leadership-item-main">
                <div class="leadership-item-title">
                  <span class="status-dot ${sanitizeText(decision.status || "open")}"></span>
                  <strong>${sanitizeText(decision.decision || "Keputusan belum diisi")}</strong>
                </div>
                <p>${sanitizeText(decision.context || "Tanpa konteks")}</p>
                <dl class="leadership-details">
                  <div><dt>Tanggal</dt><dd>${sanitizeText(formatShortDate(decision.date))}</dd></div>
                  <div><dt>PIC</dt><dd>${sanitizeText(decision.pic || "-")}</dd></div>
                  <div><dt>Deadline</dt><dd>${sanitizeText(formatShortDate(decision.deadline))}</dd></div>
                  <div><dt>Dampak</dt><dd>${sanitizeText(impactLabel(decision.impact))}</dd></div>
                </dl>
                <div class="leadership-note">
                  <strong>Dasar pertimbangan</strong>
                  <span>${sanitizeText(decision.basis || "-")}</span>
                </div>
                <div class="leadership-note">
                  <strong>Status follow-up</strong>
                  <span>${sanitizeText(statusLabel(decision.status))}</span>
                </div>
              </div>
              <div class="leadership-actions">
                <select data-decision-status="${sanitizeText(decision.id)}" aria-label="Ubah status keputusan">
                  ${decisionStatusOptions(decision.status)}
                </select>
                <button class="button button-light" type="button" data-create-decision-page="${sanitizeText(decision.id)}">
                  <i data-lucide="file-plus"></i>
                  <span>Page</span>
                </button>
                <button class="icon-button" type="button" data-remove-decision="${sanitizeText(decision.id)}" aria-label="Hapus keputusan">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">Belum ada keputusan pimpinan. Tambahkan keputusan pertama agar tidak hilang di chat.</p>`;

  list.querySelectorAll("[data-remove-decision]").forEach((button) => {
    button.addEventListener("click", () => onRemoveDecision?.(button.dataset.removeDecision));
  });

  list.querySelectorAll("[data-decision-status]").forEach((select) => {
    select.addEventListener("change", () => onStatusChange?.(select.dataset.decisionStatus, select.value));
  });

  list.querySelectorAll("[data-create-decision-page]").forEach((button) => {
    button.addEventListener("click", () => onCreatePage?.(button.dataset.createDecisionPage));
  });
}

export function renderMeetingMinutes({ state, onRemoveMeeting, onCreatePage }) {
  const leadership = getLeadershipState(state);
  const meetings = leadership.meetings || [];
  const followUpCount = meetings.reduce((total, meeting) => total + countLines(meeting.followUp), 0);
  const pendingIssues = meetings.reduce((total, meeting) => total + countLines(meeting.pendingIssues), 0);
  const decisions = meetings.reduce((total, meeting) => total + countLines(meeting.decisions), 0);

  setText("meetingTotal", meetings.length);
  setText("meetingFollowUps", followUpCount);
  setText("meetingDecisions", decisions);
  setText("meetingPendingIssues", pendingIssues);

  const list = $("meetingMinutesList");
  if (!list) return;

  list.innerHTML = meetings.length
    ? meetings
        .map(
          (meeting) => `
            <article class="leadership-item">
              <div class="leadership-item-main">
                <div class="leadership-item-title">
                  <span class="status-dot meeting"></span>
                  <strong>${sanitizeText(meeting.title || "Rapat tanpa judul")}</strong>
                </div>
                <p>${sanitizeText(meeting.agenda || "Agenda belum diisi")}</p>
                <dl class="leadership-details">
                  <div><dt>Tanggal</dt><dd>${sanitizeText(formatShortDate(meeting.date))}</dd></div>
                  <div><dt>Peserta</dt><dd>${sanitizeText(meeting.participants || "-")}</dd></div>
                  <div><dt>PIC</dt><dd>${sanitizeText(meeting.pic || "-")}</dd></div>
                  <div><dt>Deadline</dt><dd>${sanitizeText(formatShortDate(meeting.deadline))}</dd></div>
                </dl>
                <div class="leadership-note">
                  <strong>Keputusan</strong>
                  <span>${sanitizeText(meeting.decisions || "-")}</span>
                </div>
                <div class="leadership-note">
                  <strong>Follow-up</strong>
                  <span>${sanitizeText(meeting.followUp || "-")}</span>
                </div>
                <div class="leadership-note">
                  <strong>Isu tertunda</strong>
                  <span>${sanitizeText(meeting.pendingIssues || "-")}</span>
                </div>
                ${
                  meeting.documentLink
                    ? `<a class="leadership-link" href="${sanitizeText(safeUrl(meeting.documentLink))}" target="_blank" rel="noopener noreferrer">Link dokumen</a>`
                    : ""
                }
              </div>
              <div class="leadership-actions">
                <button class="button button-light" type="button" data-create-meeting-page="${sanitizeText(meeting.id)}">
                  <i data-lucide="file-plus"></i>
                  <span>Page</span>
                </button>
                <button class="icon-button" type="button" data-remove-meeting="${sanitizeText(meeting.id)}" aria-label="Hapus notulen">
                  <i data-lucide="trash-2"></i>
                </button>
              </div>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">Belum ada notulen rapat. Buat rapat pertama dengan format agenda, keputusan, PIC, deadline, dan follow-up.</p>`;

  list.querySelectorAll("[data-remove-meeting]").forEach((button) => {
    button.addEventListener("click", () => onRemoveMeeting?.(button.dataset.removeMeeting));
  });

  list.querySelectorAll("[data-create-meeting-page]").forEach((button) => {
    button.addEventListener("click", () => onCreatePage?.(button.dataset.createMeetingPage));
  });
}

export function decisionToMarkdown(decision = {}) {
  return `# Decision Register - ${decision.context || "Keputusan Pimpinan"}

## Tanggal
${decision.date || "-"}

## Konteks
${decision.context || "-"}

## Keputusan
${decision.decision || "-"}

## Dasar Pertimbangan
${decision.basis || "-"}

## PIC Pelaksana
${decision.pic || "-"}

## Deadline
${decision.deadline || "-"}

## Dampak
${impactLabel(decision.impact)}

## Status Follow-up
${statusLabel(decision.status)}`;
}

export function meetingToMarkdown(meeting = {}) {
  return `# Notulen - ${meeting.title || "Rapat"}

## Agenda
${meeting.agenda || "-"}

## Peserta
${meeting.participants || "-"}

## Keputusan
${meeting.decisions || "-"}

## PIC
${meeting.pic || "-"}

## Deadline
${meeting.deadline || "-"}

## Follow-up
${meeting.followUp || "-"}

## Isu Tertunda
${meeting.pendingIssues || "-"}

## Link Dokumen
${meeting.documentLink || "-"}`;
}

function decisionStatusOptions(currentStatus = "open") {
  return [
    ["open", "Open"],
    ["in-progress", "In Progress"],
    ["waiting", "Waiting"],
    ["closed", "Closed"],
  ]
    .map(([value, label]) => `<option value="${value}" ${value === currentStatus ? "selected" : ""}>${label}</option>`)
    .join("");
}

function statusLabel(status = "open") {
  const labels = {
    open: "Open",
    "in-progress": "In Progress",
    waiting: "Waiting",
    closed: "Closed",
  };
  return labels[status] || "Open";
}

function impactLabel(impact = "medium") {
  const labels = {
    low: "Rendah",
    medium: "Sedang",
    high: "Tinggi",
    critical: "Kritis",
  };
  return labels[impact] || "Sedang";
}

function formatShortDate(dateValue) {
  if (!dateValue) return "-";
  return formatDate(`${dateValue}T00:00`);
}

function countLines(value = "") {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean).length;
}

function safeUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "#";
}

function setText(id, value) {
  if ($(id)) $(id).textContent = value;
}
