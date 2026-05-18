import { generateId, getTodayISO } from "../utils/helpers.js";

const columnAliases = {
  rfqNumber: ["rfq number", "rfq no", "rfq", "request number"],
  itemName: ["item name", "item", "service name", "material", "description"],
  specification: ["specification", "spec", "description / specification", "description"],
  quantity: ["quantity", "qty"],
  uom: ["uom", "unit"],
  requester: ["requester", "department", "requester / department"],
  requiredDate: ["required date", "need date", "delivery required"],
  vendorName: ["vendor name", "supplier", "supplier name", "vendor"],
  vendorContact: ["vendor contact", "contact", "pic"],
  bidDate: ["bid date", "quotation date", "quote date"],
  currency: ["currency", "curr"],
  unitPrice: ["unit price", "price"],
  totalPrice: ["total price", "amount", "total amount"],
  leadTime: ["lead time", "delivery lead time"],
  paymentTerms: ["payment terms", "payment term"],
  warranty: ["warranty"],
  deliveryTerms: ["delivery terms", "incoterm", "delivery term"],
  technicalCompliance: ["technical compliance", "technical status", "compliance"],
  bidStatus: ["bid status", "commercial status", "status"],
  recommendation: ["recommendation", "recommended", "remarks"],
  rfqStatus: ["rfq status", "procurement status"],
};

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

export function importRfqCsvText(csvText, currentState) {
  const rows = parseCsv(csvText);
  if (!rows.length) {
    return { imported: 0, updated: 0, bidRows: 0 };
  }

  const normalizedRows = rows.map(normalizeRow).filter((row) => row.rfqNumber || row.itemName || row.vendorName);
  const groups = groupRowsByRfq(normalizedRows);
  const now = getTodayISO();

  let imported = 0;
  let updated = 0;
  let bidRows = 0;

  Object.values(groups).forEach((group) => {
    const first = group[0];
    const rfqNumber = first.rfqNumber || generateId("rfq");
    const existingPage = (currentState.pages || []).find((page) => page.rfqNumber === rfqNumber);
    const bids = group.map(rowToBid);
    const rfqStatus = normalizeRfqStatus(first.rfqStatus) || inferRfqStatus(bids);
    const title = `${rfqNumber} - ${first.itemName || "Supplier Bid"}`;
    const markdown = buildRfqMarkdown({ rfqNumber, first, bids, rfqStatus });

    bidRows += bids.length;

    if (existingPage) {
      existingPage.title = title;
      existingPage.icon = "R";
      existingPage.status = rfqStatus === "delivered" ? "done" : rfqStatus === "negotiation" ? "review" : "doing";
      existingPage.rfqStatus = rfqStatus;
      existingPage.supplierBids = bids;
      existingPage.markdown = markdown;
      existingPage.tags = uniqueTags([...(existingPage.tags || []), "rfq", "supplier-bids", "procurement"]);
      existingPage.updatedAt = now;
      updated += 1;
      return;
    }

    currentState.pages.push({
      id: generateId("page"),
      title,
      icon: "R",
      status: rfqStatus === "delivered" ? "done" : rfqStatus === "negotiation" ? "review" : "doing",
      rfqStatus,
      rfqNumber,
      supplierBids: bids,
      tags: uniqueTags(["rfq", "supplier-bids", "procurement"]),
      markdown,
      reminderAt: "",
      reminderDone: false,
      createdAt: now,
      updatedAt: now,
    });
    imported += 1;
  });

  return { imported, updated, bidRows };
}

function parseCsv(csvText) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index += 1) {
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

  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  return rows.slice(1).map((values) => {
    return headers.reduce((item, header, index) => {
      item[header] = values[index] || "";
      return item;
    }, {});
  });
}

function normalizeRow(row) {
  return Object.fromEntries(
    Object.entries(columnAliases).map(([key, aliases]) => {
      const value = aliases.map(normalizeHeader).map((alias) => row[alias]).find(Boolean) || "";
      return [key, value.trim()];
    }),
  );
}

function groupRowsByRfq(rows) {
  return rows.reduce((groups, row) => {
    const key = row.rfqNumber || `${row.itemName || "RFQ"}-${row.requiredDate || "unscheduled"}`;
    groups[key] ||= [];
    groups[key].push(row);
    return groups;
  }, {});
}

function rowToBid(row) {
  return {
    vendorName: row.vendorName,
    vendorContact: row.vendorContact,
    bidDate: row.bidDate,
    currency: row.currency,
    unitPrice: row.unitPrice,
    totalPrice: row.totalPrice,
    leadTime: row.leadTime,
    paymentTerms: row.paymentTerms,
    warranty: row.warranty,
    deliveryTerms: row.deliveryTerms,
    technicalCompliance: row.technicalCompliance,
    bidStatus: row.bidStatus,
    recommendation: row.recommendation,
  };
}

function buildRfqMarkdown({ rfqNumber, first, bids, rfqStatus }) {
  const bidRows = bids
    .map((bid) => {
      return `| ${bid.vendorName || "-"} | ${bid.currency || "-"} | ${bid.totalPrice || bid.unitPrice || "-"} | ${bid.leadTime || "-"} | ${bid.technicalCompliance || "-"} | ${bid.recommendation || "-"} |`;
    })
    .join("\n");

  return `# ${rfqNumber} - ${first.itemName || "Supplier Bid"}

## RFQ Summary
- RFQ Number: ${rfqNumber}
- Item / Service: ${first.itemName || "-"}
- Specification: ${first.specification || "-"}
- Quantity: ${first.quantity || "-"} ${first.uom || ""}
- Requester / Department: ${first.requester || "-"}
- Required Date: ${first.requiredDate || "-"}
- RFQ Status: ${rfqStatus}

## Supplier Bids
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

function normalizeRfqStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return rfqStatusMap[normalized] || "";
}

function inferRfqStatus(bids) {
  if (bids.some((bid) => /recommend|approval/i.test(`${bid.recommendation} ${bid.bidStatus}`))) return "negotiation";
  if (bids.some((bid) => /negotiation|clarification/i.test(`${bid.bidStatus} ${bid.technicalCompliance}`))) return "negotiation";
  if (bids.some((bid) => bid.vendorName || bid.totalPrice || bid.unitPrice)) return "quotation";
  return "request";
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function uniqueTags(tags) {
  return [...new Set(tags.filter(Boolean))];
}
