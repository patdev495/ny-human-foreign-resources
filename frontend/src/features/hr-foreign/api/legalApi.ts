import type {
  Contract,
  ContractCreate,
  ContractUpdate,
  DocWarningConfigResponse,
  DocWarningConfigUpdateItem,
  ExpiringDocumentsResponse,
  WorkPermit,
  WorkPermitCreate,
  WorkPermitUpdate,
} from "../types";
import { BASE } from "./apiUtils";

export async function fetchContracts(employeeId: number): Promise<Contract[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/contracts`);
  if (!res.ok) throw new Error("Failed to fetch contracts");
  return res.json() as Promise<Contract[]>;
}

export async function createContract(
  employeeId: number,
  payload: ContractCreate
): Promise<Contract> {
  const res = await fetch(`${BASE}/employees/${employeeId}/contracts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create contract");
  return res.json() as Promise<Contract>;
}

export async function updateContract(
  contractId: number,
  payload: ContractUpdate
): Promise<Contract> {
  const res = await fetch(`${BASE}/contracts/${contractId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update contract");
  return res.json() as Promise<Contract>;
}

export async function deleteContract(contractId: number): Promise<void> {
  const res = await fetch(`${BASE}/contracts/${contractId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete contract");
}

export async function fetchWorkPermits(employeeId: number): Promise<WorkPermit[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/work-permits`);
  if (!res.ok) throw new Error("Failed to fetch work permits");
  return res.json() as Promise<WorkPermit[]>;
}

export async function createWorkPermit(
  employeeId: number,
  payload: WorkPermitCreate
): Promise<WorkPermit> {
  const res = await fetch(`${BASE}/employees/${employeeId}/work-permits`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create work permit");
  return res.json() as Promise<WorkPermit>;
}

export async function updateWorkPermit(
  permitId: number,
  payload: WorkPermitUpdate
): Promise<WorkPermit> {
  const res = await fetch(`${BASE}/work-permits/${permitId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update work permit");
  return res.json() as Promise<WorkPermit>;
}

export async function deleteWorkPermit(permitId: number): Promise<void> {
  const res = await fetch(`${BASE}/work-permits/${permitId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete work permit");
}

export async function fetchDocWarningConfigs(): Promise<DocWarningConfigResponse> {
  const res = await fetch(`${BASE}/doc-warning-configs`);
  if (!res.ok) throw new Error("Failed to fetch doc warning configs");
  return res.json() as Promise<DocWarningConfigResponse>;
}

export async function updateDocWarningConfigs(
  payload: DocWarningConfigUpdateItem[]
): Promise<DocWarningConfigResponse> {
  const res = await fetch(`${BASE}/doc-warning-configs`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update doc warning configs");
  return res.json() as Promise<DocWarningConfigResponse>;
}

export async function fetchExpiringDocuments(days?: number): Promise<ExpiringDocumentsResponse> {
  const url = days !== undefined ? `${BASE}/expiring-documents?days=${days}` : `${BASE}/expiring-documents`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch expiring documents");
  return res.json() as Promise<ExpiringDocumentsResponse>;
}

export async function downloadLegalProfileReport(includeAttachments: boolean = true): Promise<void> {
  const url = `${BASE}/exports/legal-profile?include_attachments=${includeAttachments ? "true" : "false"}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Không thể tải Báo cáo Hồ sơ & Pháp lý");
  }
  const blob = await res.blob();
  const filename = includeAttachments ? "Bao_Cao_Ho_So_Phap_Ly.zip" : "Bao_Cao_Ho_So_Phap_Ly.xlsx";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

export async function downloadPresenceAccommodationReport(): Promise<void> {
  const url = `${BASE}/exports/presence-accommodation`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Không thể tải Báo cáo Hiện diện & Chỗ ở");
  }
  const blob = await res.blob();
  const filename = "Bao_Cao_Hien_Dien_Cho_O.xlsx";
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
