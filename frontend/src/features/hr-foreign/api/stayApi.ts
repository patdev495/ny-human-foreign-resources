import type {
  Stay,
  StayCreate,
  StayUpdate,
  TamTru,
  TamTruCreate,
  TamTruUpdate,
  Visa,
  VisaCreate,
  VisaUpdate,
} from "../types";
import { BASE } from "./apiUtils";

export async function fetchStays(employeeId?: number, status?: string): Promise<Stay[]> {
  const params = new URLSearchParams();
  if (employeeId) params.append("employee_id", employeeId.toString());
  if (status) params.append("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${BASE}/stays${query}`);
  if (!res.ok) throw new Error("Failed to fetch stays");
  return res.json() as Promise<Stay[]>;
}

export async function createStay(payload: StayCreate): Promise<Stay> {
  const res = await fetch(`${BASE}/stays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create stay");
  }
  return res.json() as Promise<Stay>;
}

export async function updateStay(id: number, payload: StayUpdate): Promise<Stay> {
  const res = await fetch(`${BASE}/stays/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update stay");
  }
  return res.json() as Promise<Stay>;
}

export async function checkoutStay(stayId: number, endDate: string): Promise<Stay> {
  const res = await fetch(`${BASE}/stays/${stayId}/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ end_date: endDate }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to check out");
  }
  return res.json() as Promise<Stay>;
}

export async function fetchVisas(stayId: number): Promise<Visa[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/visas`);
  if (!res.ok) throw new Error("Failed to fetch visas");
  return res.json() as Promise<Visa[]>;
}

export async function createVisa(stayId: number, payload: VisaCreate): Promise<Visa> {
  const res = await fetch(`${BASE}/stays/${stayId}/visas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create visa");
  return res.json() as Promise<Visa>;
}

export async function deleteVisa(id: number): Promise<void> {
  const res = await fetch(`${BASE}/visas/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete visa");
}

export async function updateVisa(
  id: number,
  payload: VisaUpdate
): Promise<Visa> {
  const res = await fetch(`${BASE}/visas/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update visa");
  return res.json() as Promise<Visa>;
}

export async function fetchTamTrus(stayId: number): Promise<TamTru[]> {
  const res = await fetch(`${BASE}/stays/${stayId}/tam-trus`);
  if (!res.ok) throw new Error("Failed to fetch tam trus");
  return res.json() as Promise<TamTru[]>;
}

export async function createTamTru(stayId: number, payload: TamTruCreate): Promise<TamTru> {
  const res = await fetch(`${BASE}/stays/${stayId}/tam-trus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create tam tru");
  return res.json() as Promise<TamTru>;
}

export async function deleteTamTru(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tam-trus/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete tam tru");
}

export async function updateTamTru(
  id: number,
  payload: TamTruUpdate
): Promise<TamTru> {
  const res = await fetch(`${BASE}/tam-trus/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update tam tru");
  return res.json() as Promise<TamTru>;
}
