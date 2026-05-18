import { generateId, getTodayISO } from "../utils/helpers.js";

export const procurementImportSchema = [
  {
    label: "RFQ ID",
    key: "rfqId",
    category: "Core RFQ",
    required: true,
    aliases: ["rfq id", "rfq_id", "rfq number", "rfq no", "rfq", "request number"],
  },
  {
    label: "Item Name",
    key: "itemName",
    category: "Core RFQ",
    required: true,
    aliases: ["item name", "item_name", "item", "service name", "material", "description"],
  },
  {
    label: "Item Specification",
    key: "itemSpecification",
    category: "Core RFQ",
    aliases: ["item specification", "specification", "spec", "description / specification"],
  },
  {
    label: "Quantity",
    key: "quantity",
    category: "Core RFQ",
    type: "positiveNumber",
    aliases: ["quantity", "qty"],
  },
  {
    label: "Unit of Measure",
    key: "unitOfMeasure",
    category: "Core RFQ",
    aliases: ["unit of measure", "uom", "unit"],
  },
  {
    label: "Requester",
    key: "requester",
    category: "Core RFQ",
    recommended: true,
    aliases: ["requester", "department", "requester / department"],
  },
  {
    label: "Procurement Owner",
    key: "procurementOwner",
    category: "Core RFQ",
    recommended: true,
    aliases: ["procurement owner", "procurement officer", "buyer", "pic procurement", "procurement_officer"],
  },
  {
    label: "Required Delivery Date",
    key: "requiredDeliveryDate",
    category: "Core RFQ",
    recommended: true,
    type: "date",
    aliases: ["required delivery date", "required date", "need date", "delivery required"],
  },
  {
    label: "Vendor ID",
    key: "vendorId",
    category: "Vendor",
    aliases: ["vendor id", "vendor_id", "supplier id", "supplier_id"],
  },
  {
    label: "Vendor Name",
    key: "vendorName",
    category: "Vendor",
    required: true,
    aliases: ["vendor name", "vendor_name", "supplier", "supplier name", "vendor"],
  },
  {
    label: "Vendor Contact Email",
    key: "vendorContactEmail",
    category: "Vendor",
    type: "email",
    aliases: ["vendor contact email", "vendor email", "vendor_email", "vendor contact", "contact", "pic"],
  },
  {
    label: "Bid Submission Date",
    key: "bidSubmissionDate",
    category: "Commercial",
    type: "date",
    aliases: ["bid submission date", "bid date", "quotation date", "quote date", "quotation_date"],
  },
  {
    label: "Currency",
    key: "currency",
    category: "Commercial",
    recommended: true,
    type: "currency",
    aliases: ["currency", "curr"],
  },
  {
    label: "Unit Price",
    key: "unitPrice",
    category: "Commercial",
    type: "nonNegativeNumber",
    aliases: ["unit price", "unit_price", "price", "harga", "bid_price_idr"],
  },
  {
    label: "Total Bid Price",
    key: "totalBidPrice",
    category: "Commercial",
    type: "nonNegativeNumber",
    aliases: ["total bid price", "total price", "total_price", "amount", "total amount"],
  },
  {
    label: "Lead Time Days",
    key: "leadTimeDays",
    category: "Commercial",
    type: "nonNegativeNumber",
    aliases: ["lead time days", "lead time", "lead_time_days", "delivery lead time", "delivery eta", "delivery_eta", "eta"],
  },
  {
    label: "Payment Terms",
    key: "paymentTerms",
    category: "Commercial",
    aliases: ["payment terms", "payment_terms", "payment term"],
  },
  {
    label: "Warranty Months",
    key: "warrantyMonths",
    category: "Commercial",
    type: "nonNegativeNumber",
    aliases: ["warranty months", "warranty_months", "warranty"],
  },
  {
    label: "Delivery Terms",
    key: "deliveryTerms",
    category: "Commercial",
    aliases: ["delivery terms", "delivery_terms", "incoterm", "delivery term"],
  },
  {
    label: "Technical Compliance Status",
    key: "technicalComplianceStatus",
    category: "Evaluation",
    enumValues: ["Compliant", "Partial", "Non-Compliant"],
    aliases: ["technical compliance status", "technical compliance", "technical status", "compliance"],
  },
  {
    label: "Procurement Recommendation",
    key: "procurementRecommendation",
    category: "Evaluation",
    aliases: ["procurement recommendation", "recommendation", "recommended", "remarks"],
  },
  {
    label: "Bid Status",
    key: "bidStatus",
    category: "Workflow",
    enumValues: ["Pending", "Received", "Negotiation", "Rejected", "Approved"],
    aliases: ["bid status", "bid_status", "commercial status", "status"],
  },
  {
    label: "RFQ Workflow Status",
    key: "rfqWorkflowStatus",
    category: "Workflow",
    recommended: true,
    enumValues: ["Request", "RFQ Sent", "Quotation Received", "Negotiation", "Approval", "PO Issued", "Delivered"],
    aliases: ["rfq workflow status", "rfq status", "rfq_status", "procurement status", "workflow status"],
  },
];

export const canonicalProcurementHeaders = procurementImportSchema.map((field) => field.label);

const rfqStatusMap = {
  request: "request",
  "rfq sent": "quotation",
  sent: "quotation",
  "quotation received": "quotation",
  quotation: "quotation",
  quote: "quotation",
  negotiation: "negotiation",
  approval: "negotiation",
  "po issued": "po-issued",
  po: "po-issued",
  delivered: "delivered",
};

export function parseProcurementCsvText(csvText) {
  const table = parseDelimitedRows(csvText);
  if (table.length < 2) return { headers: [], rows: [] };

  const headers = table[0].map((header) => String(header || "").trim());
  const rows = table.slice(1).map((values) =>
    headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {}),
  );

  return { headers, rows };
}

export function suggestProcurementMappings(sourceHeaders = []) {
  const normalizedSource = sourceHeaders.map((header) => ({
    header,
    normalized: normalizeHeader(header),
  }));
  const usedSources = new Set();

  return procurementImportSchema.reduce((mappings, field) => {
    const aliases = [field.label, field.key, ...(field.aliases || [])].map(normalizeHeader);
    const match = normalizedSource.find((source) => !usedSources.has(source.header) && aliases.includes(source.normalized));

    mappings[field.label] = match?.header || "";
    if (match) usedSources.add(match.header);
    return mappings;
  }, {});
}

export function buildProcurementImportPreview({
  sourceHeaders = [],
  sourceRows = [],
  mappings = {},
  additionalHeaders = [],
} = {}) {
  const cleanAdditionalHeaders = normalizeAdditionalHeaders(additionalHeaders);
  const mappingIssues = getMappingIssues(mappings);
  const rows = sourceRows.map((sourceRow, index) =>
    buildPreviewRow({
      sourceHeaders,
      sourceRow,
      mappings,
      additionalHeaders: cleanAdditionalHeaders,
      index,
    }),
  );

  return {
    sourceHeaders,
    mappings,
    additionalHeaders: cleanAdditionalHeaders,
    mappingIssues,
    rows,
    summary: countPreviewStatuses(rows),
  };
}

export function commitProcurementImportRows({ previewRows = [], currentState } = {}) {
  const state = currentState || { pages: [] };
  state.pages ||= [];
  const acceptedRows = previewRows.filter((row) => row.status !== "error");
  const groups = groupRowsByRfq(acceptedRows);
  const now = getTodayISO();

  let imported = 0;
  let updated = 0;
  let bidRows = 0;

  Object.values(groups).forEach((group) => {
    if (!group.length) return;

    const first = group[0].canonicalRow;
    const rfqNumber = first["RFQ ID"] || generateId("rfq");
    const existingPage = state.pages.find((page) => page.rfqNumber === rfqNumber);
    const bids = group.map((previewRow) => rowToBid(previewRow.canonicalRow));
    const rfqStatus = normalizeRfqStatus(first["RFQ Workflow Status"]) || inferRfqStatus(bids);
    const title = `${rfqNumber} - ${first["Item Name"] || "Supplier Bid"}`;
    const markdown = buildRfqMarkdown({ rfqNumber, first, bids, rfqStatus });

    bidRows += bids.length;

    const patch = {
      title,
      icon: "R",
      status: rfqStatus === "delivered" ? "done" : rfqStatus === "negotiation" ? "review" : "doing",
      rfqStatus,
      rfqNumber,
      supplierBids: bids,
      tags: uniqueTags([...(existingPage?.tags || []), "rfq", "supplier-bids", "procurement"]),
      markdown,
      updatedAt: now,
    };

    if (existingPage) {
      Object.assign(existingPage, patch);
      updated += 1;
      return;
    }

    state.pages.push({
      id: generateId("page"),
      ...patch,
      reminderAt: first["Required Delivery Date"] ? `${first["Required Delivery Date"]}T09:00` : "",
      reminderDone: false,
      dueDate: first["Required Delivery Date"] || "",
      priority: "normal",
      checklist: [],
      links: [],
      createdAt: now,
    });
    imported += 1;
  });

  return {
    imported,
    updated,
    bidRows,
    rejected: previewRows.length - acceptedRows.length,
  };
}

export function importRfqCsvText(csvText, currentState) {
  const { headers, rows } = parseProcurementCsvText(csvText);
  const preview = buildProcurementImportPreview({
    sourceHeaders: headers,
    sourceRows: rows,
    mappings: suggestProcurementMappings(headers),
    additionalHeaders: [],
  });

  return commitProcurementImportRows({ previewRows: preview.rows, currentState });
}

function buildPreviewRow({ sourceHeaders, sourceRow, mappings, additionalHeaders, index }) {
  const canonicalRow = procurementImportSchema.reduce((row, field) => {
    const sourceHeader = mappings[field.label];
    row[field.label] = sourceHeader ? String(sourceRow[sourceHeader] || "").trim() : "";
    return row;
  }, {});

  additionalHeaders.forEach((header) => {
    const sourceHeader = findSourceHeader(sourceHeaders, header);
    canonicalRow[header] = sourceHeader ? String(sourceRow[sourceHeader] || "").trim() : "";
  });

  const messages = validateCanonicalRow(canonicalRow);
  const status = messages.some((message) => message.severity === "error")
    ? "error"
    : messages.some((message) => message.severity === "warning")
      ? "warning"
      : "success";

  return {
    id: `row-${index + 1}`,
    rowNumber: index + 1,
    status,
    canonicalRow,
    messages: messages.map((message) => message.text),
  };
}

function validateCanonicalRow(row) {
  const messages = [];

  procurementImportSchema.forEach((field) => {
    const value = String(row[field.label] || "").trim();

    if (field.required && !value) {
      messages.push({ severity: "error", text: `${field.label} is required.` });
    }

    if (field.recommended && !value) {
      messages.push({
        severity: "warning",
        text: `${field.label} is empty. Future trackers may need this field.`,
      });
    }

    if (!value) return;

    if (field.type === "positiveNumber" && !isPositiveNumber(value)) {
      messages.push({ severity: "error", text: `${field.label} must be greater than zero.` });
    }

    if (field.type === "nonNegativeNumber" && !isNonNegativeNumber(value)) {
      messages.push({ severity: "error", text: `${field.label} must be a number.` });
    }

    if (field.type === "date" && !isValidDate(value)) {
      messages.push({ severity: "error", text: `${field.label} must be a valid date.` });
    }

    if (field.type === "email" && !isValidEmail(value)) {
      messages.push({ severity: "error", text: `${field.label} must be a valid email.` });
    }

    if (field.type === "currency" && !/^[A-Z]{3}$/.test(value)) {
      messages.push({ severity: "error", text: `${field.label} must be a 3-letter currency code.` });
    }

    if (field.enumValues?.length && !matchesEnum(value, field.enumValues)) {
      messages.push({
        severity: "error",
        text: `${field.label} must be one of: ${field.enumValues.join(", ")}.`,
      });
    }
  });

  const quantity = parseFlexibleNumber(row.Quantity);
  const unitPrice = parseFlexibleNumber(row["Unit Price"]);
  const totalBidPrice = String(row["Total Bid Price"] || "").trim();

  if (!totalBidPrice && Number.isFinite(quantity) && Number.isFinite(unitPrice)) {
    row["Total Bid Price"] = String(quantity * unitPrice);
    messages.push({
      severity: "warning",
      text: "Total Bid Price was calculated from Quantity and Unit Price.",
    });
  }

  return messages;
}

function getMappingIssues(mappings = {}) {
  const sources = Object.values(mappings).filter(Boolean);
  const counts = sources.reduce((items, source) => {
    items[source] = (items[source] || 0) + 1;
    return items;
  }, {});

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([source]) => `${source} is mapped more than once.`);
}

function countPreviewStatuses(rows) {
  return rows.reduce(
    (summary, row) => {
      summary[row.status] = (summary[row.status] || 0) + 1;
      return summary;
    },
    { success: 0, warning: 0, error: 0 },
  );
}

function parseDelimitedRows(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < String(csvText || "").length; index += 1) {
    const char = csvText[index];
    const next = csvText[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(value.trim());
      value = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      continue;
    }

    value += char;
  }

  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function rowToBid(row) {
  return {
    vendorId: row["Vendor ID"],
    vendorName: row["Vendor Name"],
    vendorContact: row["Vendor Contact Email"],
    bidDate: row["Bid Submission Date"],
    currency: row.Currency,
    unitPrice: row["Unit Price"],
    totalPrice: row["Total Bid Price"],
    leadTime: row["Lead Time Days"],
    paymentTerms: row["Payment Terms"],
    warranty: row["Warranty Months"],
    deliveryTerms: row["Delivery Terms"],
    technicalCompliance: row["Technical Compliance Status"],
    bidStatus: row["Bid Status"],
    recommendation: row["Procurement Recommendation"],
    additionalData: getAdditionalData(row),
  };
}

function buildRfqMarkdown({ rfqNumber, first, bids, rfqStatus }) {
  const bidRows = bids
    .map((bid) => {
      return `| ${bid.vendorName || "-"} | ${bid.currency || "-"} | ${bid.totalPrice || bid.unitPrice || "-"} | ${bid.leadTime || "-"} | ${bid.technicalCompliance || "-"} | ${bid.recommendation || "-"} |`;
    })
    .join("\n");
  const additionalRows = Object.entries(getAdditionalData(first))
    .map(([key, value]) => `- ${key}: ${value || "-"}`)
    .join("\n");

  return `# ${rfqNumber} - ${first["Item Name"] || "Supplier Bid"}

## RFQ Summary
- RFQ ID: ${rfqNumber}
- Item / Service: ${first["Item Name"] || "-"}
- Specification: ${first["Item Specification"] || "-"}
- Quantity: ${first.Quantity || "-"} ${first["Unit of Measure"] || ""}
- Requester: ${first.Requester || "-"}
- Procurement Owner: ${first["Procurement Owner"] || "-"}
- Required Delivery Date: ${first["Required Delivery Date"] || "-"}
- RFQ Status: ${first["RFQ Workflow Status"] || rfqStatus}

${additionalRows ? `## Additional Fields\n${additionalRows}\n\n` : ""}## Supplier Bids
| Vendor | Currency | Price | Lead Time | Technical | Recommendation |
|---|---|---:|---|---|---|
${bidRows || "| - | - | - | - | - | - |"}

## Follow-up Checklist
- [ ] Validate technical compliance
- [ ] Compare commercial offer
- [ ] Clarify lead time and payment terms
- [ ] Prepare negotiation notes
- [ ] Submit recommendation for approval`;
}

function groupRowsByRfq(rows) {
  return rows.reduce((groups, previewRow) => {
    const row = previewRow.canonicalRow;
    const key = row["RFQ ID"] || `${row["Item Name"] || "RFQ"}-${row["Required Delivery Date"] || "unscheduled"}`;
    groups[key] ||= [];
    groups[key].push(previewRow);
    return groups;
  }, {});
}

function normalizeRfqStatus(value) {
  return rfqStatusMap[normalizeHeader(value)] || "";
}

function inferRfqStatus(bids) {
  if (bids.some((bid) => /approval|approved|recommend|negotiation/i.test(`${bid.recommendation} ${bid.bidStatus}`))) {
    return "negotiation";
  }
  if (bids.some((bid) => bid.vendorName || bid.totalPrice || bid.unitPrice)) return "quotation";
  return "request";
}

function getAdditionalData(row) {
  const canonicalSet = new Set(canonicalProcurementHeaders);
  return Object.fromEntries(Object.entries(row).filter(([key, value]) => !canonicalSet.has(key) && String(value || "").trim()));
}

function normalizeAdditionalHeaders(headers) {
  const items = Array.isArray(headers) ? headers : String(headers || "").split(",");
  return [...new Set(items.map((header) => String(header || "").trim()).filter(Boolean))];
}

function findSourceHeader(sourceHeaders, targetHeader) {
  const normalizedTarget = normalizeHeader(targetHeader);
  return sourceHeaders.find((sourceHeader) => normalizeHeader(sourceHeader) === normalizedTarget) || "";
}

function matchesEnum(value, enumValues) {
  const normalizedValue = normalizeHeader(value);
  return enumValues.some((item) => normalizeHeader(item) === normalizedValue);
}

function isPositiveNumber(value) {
  const number = parseFlexibleNumber(value);
  return Number.isFinite(number) && number > 0;
}

function isNonNegativeNumber(value) {
  const number = parseFlexibleNumber(value);
  return Number.isFinite(number) && number >= 0;
}

function parseFlexibleNumber(value) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  const normalized = String(value).replace(/[^\d.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") return Number.NaN;
  return Number(normalized);
}

function isValidDate(value) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}
