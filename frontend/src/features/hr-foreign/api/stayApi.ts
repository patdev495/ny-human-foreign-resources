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
import { BASE, formatApiError } from "./apiUtils";

export async function fetchStays(employeeId?: number, status?: string): Promise<Stay[]> {
  const params = new URLSearchParams();
  if (employeeId) params.append("employee_id", employeeId.toString());
  if (status) params.append("status", status);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await fetch(`${BASE}/stays${query}`);
  if (!res.ok) throw new Error("Failed to fetch stays");
  return res.json() as Promise<Stay[]>;
}

export async function fetchStay(id: number): Promise<Stay> {
  const res = await fetch(`${BASE}/stays/${id}`);
  if (!res.ok) throw new Error("Failed to fetch stay");
  return res.json() as Promise<Stay>;
}

export async function createStay(payload: StayCreate): Promise<Stay> {
  const res = await fetch(`${BASE}/stays`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to create stay"));
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
    throw new Error(formatApiError(err, "Failed to update stay"));
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

export async function deleteStay(stayId: number): Promise<void> {
  const res = await fetch(`${BASE}/stays/${stayId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Không thể xóa đợt lưu trú");
  }
}


export async function fetchVisas(employeeId: number): Promise<Visa[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/visas`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to fetch visas"));
  }
  return res.json() as Promise<Visa[]>;
}

export async function createVisa(employeeId: number, payload: VisaCreate): Promise<Visa> {
  const res = await fetch(`${BASE}/employees/${employeeId}/visas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to create visa"));
  }
  return res.json() as Promise<Visa>;
}

export async function deleteVisa(id: number): Promise<void> {
  const res = await fetch(`${BASE}/visas/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to delete visa"));
  }
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to update visa"));
  }
  return res.json() as Promise<Visa>;
}

export async function fetchTamTrus(employeeId: number): Promise<TamTru[]> {
  const res = await fetch(`${BASE}/employees/${employeeId}/tam-trus`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to fetch tam trus"));
  }
  return res.json() as Promise<TamTru[]>;
}

export async function createTamTru(employeeId: number, payload: TamTruCreate): Promise<TamTru> {
  const res = await fetch(`${BASE}/employees/${employeeId}/tam-trus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to create tam tru"));
  }
  return res.json() as Promise<TamTru>;
}

export async function deleteTamTru(id: number): Promise<void> {
  const res = await fetch(`${BASE}/tam-trus/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to delete tam tru"));
  }
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(formatApiError(err, "Failed to update tam tru"));
  }
  return res.json() as Promise<TamTru>;
}
