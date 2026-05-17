import { generateId, getTodayISO } from "../utils/helpers.js";

const templateDefinitions = {
  procurement: {
    id: "procurement",
    label: "Mode Procurement",
    workspaceName: "Procurement Workspace",
    displayName: "Procurement Staff",
    description: "Track vendors, RFQs, purchase orders, deliveries, and contract follow-ups.",
    pages: [
      {
        title: "RFQ Follow-up - Vendor Comparison",
        icon: "R",
        status: "doing",
        rfqStatus: "quotation-received",
        tags: ["rfq", "vendor", "urgent"],
        markdown:
          "# RFQ Follow-up - Vendor Comparison\n\n## Vendors\n- Vendor A: waiting quotation\n- Vendor B: quotation received\n- Vendor C: technical clarification\n\n## Checklist\n- [ ] Compare price and lead time\n- [ ] Validate technical compliance\n- [ ] Prepare negotiation notes\n- [ ] Submit recommendation for approval",
      },
      {
        title: "PO Delivery Tracker",
        icon: "P",
        status: "review",
        rfqStatus: "po-issued",
        tags: ["po", "delivery", "follow-up"],
        markdown:
          "# PO Delivery Tracker\n\nTrack purchase order delivery status, ETA, receiving confirmation, and blockers.\n\n## Pending Items\n- PO number:\n- Vendor:\n- Expected delivery:\n- Warehouse confirmation:\n- Issue/risk:",
      },
      {
        title: "Vendor Evaluation Notes",
        icon: "V",
        status: "ideas",
        rfqStatus: "negotiation",
        tags: ["vendor", "evaluation"],
        markdown:
          "# Vendor Evaluation Notes\n\n## Evaluation Criteria\n- Price competitiveness\n- Delivery reliability\n- Document completeness\n- Service responsiveness\n- Safety/compliance record",
      },
      {
        title: "Contract Renewal Reminder",
        icon: "C",
        status: "ideas",
        rfqStatus: "request",
        tags: ["contract", "renewal"],
        markdown:
          "# Contract Renewal Reminder\n\nUse this page to track agreement expiry, renewal owner, supporting documents, and approval path.",
      },
    ],
  },
  staff: {
    id: "staff",
    label: "Mode Office Staff",
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
    label: "Mode Manager",
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
  "bps-manager": {
    id: "bps-manager",
    label: "Mode Kepala Kantor BPS",
    workspaceName: "Dashboard Kepala Kantor BPS",
    displayName: "Kepala Kantor BPS",
    description:
      "Koordinasi program statistik, agenda rapat, deadline laporan, review dokumen, dan monitoring kegiatan BPS.",
    se2026Executive: {
      regionName: "Kabupaten Mojokerto",
      regionCode: "3516",
      territoryProgress: 18,
      officerProgress: 72,
      businessesRecorded: 1240,
      greenAreas: 8,
      yellowAreas: 5,
      redAreas: 2,
      documentsReview: 3,
      openDecisions: 2,
      criticalIssues: 1,
      internalNote:
        "Pantau wilayah merah setiap pagi, prioritaskan dukungan petugas untuk area dengan progres input rendah.",
      publicUpdates: [
        {
          title: "BPS Kabupaten Mojokerto",
          url: "https://mojokertokab.bps.go.id",
          source: "BPS",
          publishedAt: "2026-05-18",
          note: "Portal resmi BPS Kabupaten Mojokerto untuk rilis, publikasi, dan berita statistik daerah.",
        },
        {
          title: "Lapangan Usaha Cakupan SE2026 - Kategori G",
          url: "https://mojokertokab.bps.go.id/id/news/2025/05/27/123/lapangan-usaha-cakupan-se2026--kategori-g-.html",
          source: "BPS Kabupaten Mojokerto",
          publishedAt: "2025-05-27",
          note: "Rujukan cakupan usaha perdagangan besar dan eceran dalam SE2026.",
        },
        {
          title: "Kabupaten Mojokerto Dalam Angka 2026",
          url: "https://mojokertokab.bps.go.id/id/publication/2026/02/27/12624a2f5e14395138d81ecc/kabupaten-mojokerto-dalam-angka-2026.html",
          source: "BPS Kabupaten Mojokerto",
          publishedAt: "2026-02-27",
          note: "Basis konteks wilayah dan indikator ekonomi-sosial Kabupaten Mojokerto.",
        },
        {
          title: "PDRB Kabupaten Mojokerto Menurut Lapangan Usaha 2021-2025",
          url: "https://mojokertokab.bps.go.id/id/publication/2026/04/06/24e35feb8f8fec92a2d532ca/produk-domestik-regional-bruto-kabupaten-mojokerto-menurut-lapangan-usaha-2021-2025.html",
          source: "BPS Kabupaten Mojokerto",
          publishedAt: "2026-04-06",
          note: "Konteks struktur ekonomi daerah untuk membaca hasil dan risiko pendataan SE2026.",
        },
      ],
      dataSources: [
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
      ],
    },
    pages: [
      {
        title: "Program Monitoring Board",
        icon: "P",
        status: "fieldwork",
        tags: ["survei", "monitoring", "urgent", "kabupaten"],
        markdown:
          "# Program Monitoring Board\n\n## Kegiatan Sedang Berjalan\n- Program: Survei Sosial Ekonomi Nasional\n- PIC: Koordinator Fungsi Statistik Sosial\n- Tahap: Fieldwork\n- Risiko: Keterlambatan input dari beberapa kecamatan\n- Keputusan yang dibutuhkan: Penyesuaian jadwal supervisi lapangan\n\n## Checklist Minggu Ini\n- [ ] Konfirmasi progres lapangan harian\n- [ ] Cek kelengkapan dokumen pencacahan\n- [ ] Tindak lanjuti wilayah dengan progres rendah\n- [ ] Siapkan bahan validasi awal",
        reminderAt: "2026-05-20T09:00",
      },
      {
        title: "Rapat Koordinasi Statistik Daerah",
        icon: "R",
        status: "planned",
        tags: ["koordinasi daerah", "rapat", "provinsi", "urgent"],
        markdown:
          "# Rapat Koordinasi Statistik Daerah\n\n## Agenda\n- Evaluasi progres survei dan sensus berjalan\n- Sinkronisasi publikasi kabupaten/kota\n- Kesiapan validasi data sektoral\n\n## Keputusan\n-\n\n## PIC\n- Pimpinan rapat:\n- Notulis:\n- PIC tindak lanjut:\n\n## Deadline\n- Bahan rapat: 2026-05-21\n- Tindak lanjut awal: 2026-05-24\n\n## Follow-up\n- [ ] Kirim undangan dan agenda\n- [ ] Kumpulkan bahan dari setiap fungsi\n- [ ] Susun daftar keputusan",
        reminderAt: "2026-05-21T08:30",
      },
      {
        title: "Tracking Kegiatan Statistik",
        icon: "T",
        status: "validation",
        tags: ["survei", "sensus", "publikasi", "validasi data"],
        markdown:
          "# Tracking Kegiatan Statistik\n\n| Kegiatan | Jenis | PIC | Tahap | Deadline | Catatan |\n| --- | --- | --- | --- | --- | --- |\n| Survei Sosial Ekonomi | survei | Fungsi Sosial | Validation | 2026-05-24 | Cek anomali rumah tangga |\n| Sensus Pertanian Lanjutan | sensus | Fungsi Produksi | Fieldwork | 2026-05-28 | Supervisi wilayah prioritas |\n| Publikasi Daerah Dalam Angka | publikasi | IPDS | Reporting | 2026-06-03 | Review narasi dan tabel |\n| Koordinasi Data Sektoral | koordinasi daerah | Neraca | Planned | 2026-05-30 | Tunggu konfirmasi OPD |\n\n## Perlu Perhatian\n- [ ] Wilayah dengan progres rendah\n- [ ] Validasi data outlier\n- [ ] Draft publikasi yang menunggu review",
        reminderAt: "2026-05-24T10:00",
      },
      {
        title: "Reminder Laporan dan Approval",
        icon: "L",
        status: "reporting",
        tags: ["laporan", "publikasi", "approval pimpinan", "urgent"],
        markdown:
          "# Reminder Laporan dan Approval\n\n## Deadline Publikasi\n- Publikasi statistik bulanan:\n- Batas finalisasi tabel:\n- Review narasi:\n\n## Batas Input Data\n- Sistem internal:\n- Wilayah belum lengkap:\n- PIC follow-up:\n\n## Review Dokumen\n- [ ] Konsistensi angka antar tabel\n- [ ] Catatan metodologi\n- [ ] Ringkasan eksekutif\n- [ ] Persetujuan pimpinan\n\n## Approval Pimpinan\n- Dokumen:\n- Keputusan:\n- Deadline:",
        reminderAt: "2026-05-25T14:00",
      },
      {
        title: "Pekerjaan Selesai Minggu Ini",
        icon: "S",
        status: "submitted",
        tags: ["laporan bulanan", "publikasi", "sdm"],
        markdown:
          "# Pekerjaan Selesai Minggu Ini\n\n## Submitted\n- Laporan realisasi kegiatan mingguan\n- Draft briefing pimpinan\n- Rekap absensi kegiatan lapangan\n\n## Catatan Evaluasi\n- Yang berjalan baik:\n- Hambatan utama:\n- Perlu keputusan lanjutan:\n\n## Arsip\n- Link dokumen:\n- Tanggal submit:\n- Penerima:",
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
      { label: "RFQ Items", value: "rfq:any" },
      { label: "Supplier Bids", value: "bids:any" },
      { label: "Vendors", value: "bids:vendors" },
      { label: "PO Issued", value: "rfq:po-issued" },
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
  "bps-manager": {
    eyebrow: "Dashboard Kepala Kantor BPS",
    title: "Pantau kegiatan statistik, agenda rapat, review, dan deadline laporan.",
    description:
      "Ruang kerja pimpinan untuk koordinasi survei, sensus, publikasi, validasi data, laporan bulanan, dan approval lintas fungsi.",
    capabilities: ["Program", "Agenda", "Review", "Deadline"],
    statusLabel: "Monitoring Pimpinan",
    statusTitle: "Fokus pada kegiatan yang perlu keputusan.",
    statusDescription:
      "Gunakan board untuk melihat pergerakan kegiatan dari rencana, lapangan, validasi, pelaporan, sampai submitted.",
    metrics: [
      { label: "Berjalan", value: "status:fieldwork" },
      { label: "Due Soon", value: "reminders" },
      { label: "Item Review", value: "status:validation" },
      { label: "Selesai Minggu Ini", value: "completedThisWeek:submitted" },
    ],
    recentTitle: "Kegiatan Sedang Berjalan",
    recentSubtitle: "Program, rapat, laporan, dan review terbaru",
    dueTitle: "Reminder Laporan",
    dueSubtitle: "Publikasi, input data, rapat, review, approval",
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
    rfqStatus: page.rfqStatus || "",
    tags: page.tags,
    markdown: page.markdown,
    reminderAt: page.reminderAt || "",
    reminderDone: false,
    createdAt: now,
    updatedAt: now,
  }));

  const workspace = {
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

  if (template.se2026Executive) {
    workspace.se2026Executive = {
      ...template.se2026Executive,
      publicUpdates: (template.se2026Executive.publicUpdates || []).map((item) => ({
        id: generateId("se_public"),
        ...item,
      })),
      lastUpdated: now,
    };
  }

  return workspace;
}
