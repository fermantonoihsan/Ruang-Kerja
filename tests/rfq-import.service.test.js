import test from "node:test";
import assert from "node:assert/strict";

import {
  buildProcurementImportPreview,
  commitProcurementImportRows,
  parseProcurementCsvText,
  suggestProcurementMappings,
} from "../src/services/rfq-import.service.js";

test("suggests canonical mappings from common vendor spreadsheet aliases", () => {
  const sourceHeaders = [
    "RFQ Number",
    "Item Name",
    "Specification",
    "Quantity",
    "UOM",
    "Supplier",
    "Harga",
    "ETA",
    "Bid Status",
    "RFQ Status",
  ];

  const mappings = suggestProcurementMappings(sourceHeaders);

  assert.equal(mappings["RFQ ID"], "RFQ Number");
  assert.equal(mappings["Unit of Measure"], "UOM");
  assert.equal(mappings["Vendor Name"], "Supplier");
  assert.equal(mappings["Unit Price"], "Harga");
  assert.equal(mappings["Lead Time Days"], "ETA");
  assert.equal(mappings["Bid Status"], "Bid Status");
  assert.equal(mappings["RFQ Workflow Status"], "RFQ Status");
});

test("previews warning rows, error rows, duplicate mappings, calculated totals, and additional headers", () => {
  const { headers, rows } = parseProcurementCsvText(`RFQ Number,Item Name,Quantity,UOM,Supplier,Harga,ETA,Bid Status,RFQ Status,Risk Level,Notes
RFQ-001,Centrifugal Pump,2,unit,Vendor A,15000000,30,Received,Quotation Received,Low,Ready
RFQ-002,Safety Helmet,150,PCS,Vendor B,90000,abc,Bid Received,Quotation Received,Medium,Check ETA`);

  const mappings = suggestProcurementMappings(headers);
  mappings.Requester = "Supplier";

  const preview = buildProcurementImportPreview({
    sourceHeaders: headers,
    sourceRows: rows,
    mappings,
    additionalHeaders: ["Risk Level", "Notes", "Budget Code"],
  });

  assert.equal(preview.summary.success, 0);
  assert.equal(preview.summary.warning, 1);
  assert.equal(preview.summary.error, 1);
  assert.ok(preview.mappingIssues.some((issue) => issue.includes("Supplier is mapped more than once")));
  assert.equal(preview.rows[0].status, "warning");
  assert.equal(preview.rows[0].canonicalRow["Total Bid Price"], "30000000");
  assert.equal(preview.rows[0].canonicalRow["Risk Level"], "Low");
  assert.match(preview.rows[0].messages.join(" "), /Procurement Owner is empty/);
  assert.equal(preview.rows[1].status, "error");
  assert.match(preview.rows[1].messages.join(" "), /Lead Time Days must be a number/);
  assert.match(preview.rows[1].messages.join(" "), /Bid Status must be one of/);
});

test("commits success and warning rows while rejecting error rows and writing additional headers to markdown", () => {
  const { headers, rows } = parseProcurementCsvText(`RFQ Number,Item Name,Specification,Quantity,UOM,Requester,Required Date,Vendor Name,Vendor Contact,Currency,Unit Price,Total Price,Lead Time,Payment Terms,Warranty,Delivery Terms,Technical Compliance,Recommendation,Bid Status,RFQ Status,Risk Level,Notes
RFQ-001,Centrifugal Pump,API 610,2,unit,Maintenance,2026-06-30,Vendor A,sales@vendor-a.com,IDR,15000000,30000000,30,30 days,12,DAP Plant,Compliant,Recommended,Received,Quotation Received,Low,Ready
RFQ-002,Safety Helmet,,150,PCS,Maintenance,2026-06-30,Vendor B,sales@vendor-b.com,IDR,90000,13500000,abc,30 days,12,DAP Plant,Compliant,Review,Bid Received,Quotation Received,Medium,Check ETA`);

  const preview = buildProcurementImportPreview({
    sourceHeaders: headers,
    sourceRows: rows,
    mappings: suggestProcurementMappings(headers),
    additionalHeaders: ["Risk Level", "Notes"],
  });
  const state = { pages: [] };

  const result = commitProcurementImportRows({ previewRows: preview.rows, currentState: state });

  assert.equal(result.imported, 1);
  assert.equal(result.rejected, 1);
  assert.equal(result.bidRows, 1);
  assert.equal(state.pages.length, 1);
  assert.equal(state.pages[0].rfqNumber, "RFQ-001");
  assert.equal(state.pages[0].rfqStatus, "quotation");
  assert.equal(state.pages[0].supplierBids[0].vendorName, "Vendor A");
  assert.match(state.pages[0].markdown, /Risk Level: Low/);
  assert.match(state.pages[0].markdown, /Notes: Ready/);
});
