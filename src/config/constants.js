export const STORAGE_KEY = "atlas_workspace_state_v2";

export const columns = [
  { id: "ideas", title: "Ideas" },
  { id: "doing", title: "Doing" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

export const bpsManagerColumns = [
  { id: "planned", title: "Planned" },
  { id: "fieldwork", title: "Fieldwork" },
  { id: "validation", title: "Validation" },
  { id: "reporting", title: "Reporting" },
  { id: "submitted", title: "Submitted" },
];

export function getWorkspaceColumns(templateId = "") {
  if (templateId === "bps-manager") return bpsManagerColumns;
  return columns;
}

export const rfqColumns = [
  { id: "request", title: "Request" },
  { id: "quotation", title: "Quotation" },
  { id: "negotiation", title: "Negotiation" },
  { id: "po-issued", title: "PO Issued" },
  { id: "delivered", title: "Delivered" },
];
