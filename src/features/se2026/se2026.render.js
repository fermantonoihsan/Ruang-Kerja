import { formatDate, isDueSoon, sanitizeText } from "../../utils/helpers.js";

const $ = (id) => document.getElementById(id);

export function renderSe2026ExecutiveDashboard({ state, onRemovePublicUpdate }) {
  const executive = getExecutiveState(state);
  const pages = state.pages || [];
  const activeReminders = pages.filter((page) => page.reminderAt && !page.reminderDone);
  const dueSoon = activeReminders.filter((page) => isDueSoon(page.reminderAt, 7));
  const documentsReview = executive.documentsReview + countDocumentsWaitingReview(pages);
  const openDecisions = executive.openDecisions + countOpenDecisions(pages);
  const criticalIssues = executive.criticalIssues + countCriticalIssues(pages);

  setText("seTerritoryProgress", `${executive.territoryProgress}%`);
  setText("seOfficerProgress", `${executive.officerProgress}%`);
  setText("seBusinessesRecorded", formatNumber(executive.businessesRecorded));
  setText("seGreenAreas", formatNumber(executive.greenAreas));
  setText("seYellowAreas", formatNumber(executive.yellowAreas));
  setText("seRedAreas", formatNumber(executive.redAreas));
  setText("seDueSoon", formatNumber(dueSoon.length));
  setText("seDocumentsReview", formatNumber(documentsReview));
  setText("seOpenDecisions", formatNumber(openDecisions));
  setText("seCriticalIssues", formatNumber(criticalIssues));
  setText("seRegionName", executive.regionName || "Kabupaten Mojokerto");
  setText("seRegionCode", executive.regionCode ? `Kode wilayah ${executive.regionCode}` : "Kode wilayah 3516");
  setText("seLastUpdated", executive.lastUpdated ? `Update internal: ${formatDate(executive.lastUpdated)}` : "Belum ada update internal");
  setText("seInternalNote", executive.internalNote || "Belum ada catatan internal.");

  renderHealthBar(executive);
  renderDataSources(executive.dataSources);
  renderDueSoon(dueSoon);
  renderSignalList({
    id: "seReviewList",
    pages: pages.filter(isReviewPage).slice(0, 5),
    empty: "Tidak ada dokumen menunggu review.",
  });
  renderSignalList({
    id: "seDecisionList",
    pages: pages.filter(isOpenDecisionPage).slice(0, 5),
    empty: "Tidak ada keputusan terbuka.",
  });
  renderSignalList({
    id: "seCriticalList",
    pages: pages.filter(isCriticalPage).slice(0, 5),
    empty: "Tidak ada masalah lapangan kritis.",
  });
  renderPublicUpdates(executive.publicUpdates, onRemovePublicUpdate);
  populateForm(executive);
}

export function getExecutiveState(state = {}) {
  return {
    territoryProgress: 0,
    regionName: "Kabupaten Mojokerto",
    regionCode: "3516",
    officerProgress: 0,
    businessesRecorded: 0,
    greenAreas: 0,
    yellowAreas: 0,
    redAreas: 0,
    documentsReview: 0,
    openDecisions: 0,
    criticalIssues: 0,
    lastUpdated: "",
    internalNote: "",
    publicUpdates: [],
    dataSources: defaultDataSources(),
    ...(state.se2026Executive || {}),
  };
}

function renderDataSources(dataSources = defaultDataSources()) {
  const list = $("seDataSources");
  if (!list) return;

  list.innerHTML = dataSources
    .map(
      (source) => `
        <article class="source-pill ${sanitizeText(source.type || "internal")}">
          <strong>${sanitizeText(source.label)}</strong>
          <span>${sanitizeText(source.description || "")}</span>
        </article>
      `,
    )
    .join("");
}

function renderHealthBar(executive) {
  const total = executive.greenAreas + executive.yellowAreas + executive.redAreas;
  const green = total ? (executive.greenAreas / total) * 100 : 0;
  const yellow = total ? (executive.yellowAreas / total) * 100 : 0;
  const red = total ? (executive.redAreas / total) * 100 : 0;

  const bar = $("seAreaHealthBar");
  if (!bar) return;

  bar.innerHTML = `
    <span class="green" style="width: ${green}%"></span>
    <span class="yellow" style="width: ${yellow}%"></span>
    <span class="red" style="width: ${red}%"></span>
  `;
}

function renderDueSoon(pages) {
  const list = $("seDueSoonList");
  if (!list) return;

  list.innerHTML = pages.length
    ? pages
        .slice(0, 5)
        .map(
          (page) => `
            <button class="executive-signal" type="button" data-dashboard-page="${page.id}">
              <strong>${sanitizeText(page.title)}</strong>
              <span>${formatDate(page.reminderAt)}</span>
            </button>
          `,
        )
        .join("")
    : `<p class="empty-state">Tidak ada reminder tujuh hari ke depan.</p>`;
}

function renderSignalList({ id, pages, empty }) {
  const list = $(id);
  if (!list) return;

  list.innerHTML = pages.length
    ? pages
        .map(
          (page) => `
            <button class="executive-signal" type="button" data-dashboard-page="${page.id}">
              <strong>${sanitizeText(page.title)}</strong>
              <span>${sanitizeText((page.tags || []).slice(0, 3).join(", ") || page.status || "item")}</span>
            </button>
          `,
        )
        .join("")
    : `<p class="empty-state">${sanitizeText(empty)}</p>`;
}

function renderPublicUpdates(publicUpdates = [], onRemovePublicUpdate) {
  const list = $("sePublicUpdates");
  if (!list) return;

  list.innerHTML = publicUpdates.length
    ? publicUpdates
        .map(
          (item) => `
            <article class="public-update-item">
              <div>
                <a href="${sanitizeText(safePublicUrl(item.url))}" target="_blank" rel="noopener noreferrer">
                  ${sanitizeText(item.title || item.url)}
                </a>
                <span>${sanitizeText(item.source || "Sumber publik")}${item.publishedAt ? ` - ${sanitizeText(item.publishedAt)}` : ""}</span>
                ${item.note ? `<p>${sanitizeText(item.note)}</p>` : ""}
              </div>
              <button class="icon-button" type="button" data-remove-public-update="${sanitizeText(item.id)}" aria-label="Hapus link">
                <i data-lucide="trash-2"></i>
              </button>
            </article>
          `,
        )
        .join("")
    : `<p class="empty-state">Tambahkan link update SE2026 yang sudah terpublikasi.</p>`;

  list.querySelectorAll("[data-remove-public-update]").forEach((button) => {
    button.addEventListener("click", () => {
      onRemovePublicUpdate?.(button.dataset.removePublicUpdate);
    });
  });
}

function populateForm(executive) {
  setValue("seRegionSelect", executive.regionCode || "3516");
  setValue("seTerritoryInput", executive.territoryProgress);
  setValue("seOfficerInput", executive.officerProgress);
  setValue("seBusinessesInput", executive.businessesRecorded);
  setValue("seGreenInput", executive.greenAreas);
  setValue("seYellowInput", executive.yellowAreas);
  setValue("seRedInput", executive.redAreas);
  setValue("seDocumentsInput", executive.documentsReview);
  setValue("seDecisionsInput", executive.openDecisions);
  setValue("seCriticalInput", executive.criticalIssues);
  setValue("seInternalNoteInput", executive.internalNote);
}

function defaultDataSources() {
  return [
    {
      label: "Data BPS Kabupaten Mojokerto",
      type: "bps",
      description: "Rilis, publikasi, dan berita resmi dari mojokertokab.bps.go.id.",
    },
    {
      label: "Update Internal BPS",
      type: "internal",
      description: "Angka progres, status wilayah, isu kritis, dan catatan pimpinan yang diinput tim.",
    },
  ];
}

function countDocumentsWaitingReview(pages) {
  return pages.filter(isReviewPage).length;
}

function countOpenDecisions(pages) {
  return pages.filter(isOpenDecisionPage).length;
}

function countCriticalIssues(pages) {
  return pages.filter(isCriticalPage).length;
}

function isReviewPage(page) {
  const tags = page.tags || [];
  return page.status === "validation" || tags.includes("review") || tags.includes("validasi data");
}

function isOpenDecisionPage(page) {
  const tags = page.tags || [];
  return tags.includes("keputusan") || tags.includes("approval pimpinan") || tags.includes("rapat");
}

function isCriticalPage(page) {
  const tags = page.tags || [];
  return tags.includes("urgent") && page.status !== "submitted";
}

function setText(id, value) {
  if ($(id)) $(id).textContent = value;
}

function setValue(id, value) {
  if ($(id)) $(id).value = value ?? "";
}

function safePublicUrl(value) {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "#";
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
}
