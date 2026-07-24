import type {
  DocumentAttachment,
  DocumentEntityType,
  EmployeeHistoryResponse,
  ExitDateActionPayload,
  ForeignEmployee,
  ForeignEmployeeCreate,
  ForeignEmployeeUpdate,
  TravelRecord,
  TravelRecordCreate,
  TravelRecordUpdate,
} from "../types";
import { BASE, formatApiError } from "./apiUtils";

export async function fetchEmployees(q?: string): Promise<ForeignEmployee[]> {
  const url = q ? `${BASE}/employees?q=${encodeURIComponent(q)}` : `${BASE}/employees`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json() as Promise<ForeignEmployee[]>;
}

export async function fetchEmployee(id: number): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees/${id}`);
  if (!res.ok) throw new Error("Employee not found");
  return res.json() as Promise<ForeignEmployee>;
}

export async function fetchEmployeeHistory(id: number): Promise<EmployeeHistoryResponse> {
  const res = await fetch(`${BASE}/employees/${id}/history`);
  if (!res.ok) throw new Error("Failed to fetch employee history");
  return res.json() as Promise<EmployeeHistoryResponse>;
}

export async function createEmployee(
  payload: ForeignEmployeeCreate
): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create employee");
  }
  return res.json() as Promise<ForeignEmployee>;
}

export async function updateEmployee(
  id: number,
  payload: ForeignEmployeeUpdate
): Promise<ForeignEmployee> {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update employee");
  }
  return res.json() as Promise<ForeignEmployee>;
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`${BASE}/employees/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete employee");
}

export async function fetchAttachments(
  entityType: DocumentEntityType,
  entityId: number
): Promise<DocumentAttachment[]> {
  const res = await fetch(
    `${BASE}/attachments?entity_type=${encodeURIComponent(entityType)}&entity_id=${entityId}`
  );
  if (!res.ok) throw new Error("Failed to fetch document attachments");
  return res.json() as Promise<DocumentAttachment[]>;
}

export async function uploadAttachment(
  entityType: DocumentEntityType,
  entityId: number,
  file: File
): Promise<DocumentAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("entity_type", entityType);
  formData.append("entity_id", String(entityId));

  const res = await fetch(`${BASE}/attachments`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to upload document attachment");
  }

  return res.json() as Promise<DocumentAttachment>;
}

export async function deleteAttachment(attachmentId: number): Promise<void> {
  const res = await fetch(`${BASE}/attachments/${attachmentId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete document attachment");
}

export function getAttachmentPreviewUrl(attachmentId: number): string {
  return `${BASE}/attachments/${attachmentId}/preview`;
}

export function getAttachmentDownloadUrl(attachmentId: number): string {
  return `${BASE}/attachments/${attachmentId}/download`;
}

export async function fetchTravelRecords(empId: number): Promise<TravelRecord[]> {
  const res = await fetch(`${BASE}/employees/${empId}/travel-records`);
  if (!res.ok) throw new Error("Failed to fetch travel records");
  return res.json() as Promise<TravelRecord[]>;
}

export async function createTravelRecord(
  empId: number,
  payload: TravelRecordCreate
): Promise<TravelRecord> {
  const res = await fetch(`${BASE}/employees/${empId}/travel-records`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create travel record");
  }
  return res.json() as Promise<TravelRecord>;
}

export async function updateTravelRecord(
  empId: number,
  recordId: number,
  payload: TravelRecordUpdate
): Promise<TravelRecord> {
  const res = await fetch(`${BASE}/employees/${empId}/travel-records/${recordId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update travel record");
  }
  return res.json() as Promise<TravelRecord>;
}

export async function recordEmployeeExit(
  empId: number,
  payload: ExitDateActionPayload
): Promise<TravelRecord> {
  const res = await fetch(`${BASE}/employees/${empId}/record-exit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to record exit date"));
  }
  return res.json() as Promise<TravelRecord>;
}
