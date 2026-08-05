import type {
  CalculateCostRequest,
  CalculateCostResponse,
  OwnershipGroup,
  Vehicle,
  VehicleCreatePayload,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
  VehicleProvider,
  VendorRoute,
} from "./types";


const API_BASE = "/api/vehicle-management";

export async function fetchProviders(): Promise<VehicleProvider[]> {
  const res = await fetch(`${API_BASE}/providers`);
  if (!res.ok) {
    throw new Error(`Failed to fetch providers: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVendorRoutes(providerId?: number): Promise<VendorRoute[]> {
  const url = providerId
    ? `${API_BASE}/vendor-routes?provider_id=${providerId}`
    : `${API_BASE}/vendor-routes`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch vendor routes: ${res.statusText}`);
  }
  return res.json();
}

export async function calculateCost(payload: CalculateCostRequest): Promise<CalculateCostResponse> {
  const res = await fetch(`${API_BASE}/calculate-cost`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to calculate cost: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVehicles(ownershipGroup?: OwnershipGroup): Promise<Vehicle[]> {
  const url = ownershipGroup
    ? `${API_BASE}/vehicles?ownership_group=${ownershipGroup}`
    : `${API_BASE}/vehicles`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch vehicles: ${res.statusText}`);
  }
  return res.json();
}

export async function createVehicle(payload: VehicleCreatePayload): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create vehicle: ${res.statusText}`);
  }
  return res.json();
}

export async function updateVehicle(id: number, payload: VehicleCreatePayload): Promise<Vehicle> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update vehicle: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteVehicle(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/vehicles/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete vehicle: ${res.statusText}`);
  }
}

export async function fetchDispatches(params?: {
  fromDate?: string;
  toDate?: string;
  ownershipGroup?: OwnershipGroup;
  providerId?: number;
  billingMonth?: string;
  search?: string;
}): Promise<VehicleDispatch[]> {
  const query = new URLSearchParams();
  if (params?.fromDate) query.append("from_date", params.fromDate);
  if (params?.toDate) query.append("to_date", params.toDate);
  if (params?.ownershipGroup) query.append("ownership_group", params.ownershipGroup);
  if (params?.providerId) query.append("provider_id", params.providerId.toString());
  if (params?.billingMonth) query.append("billing_month", params.billingMonth);
  if (params?.search) query.append("search", params.search);

  const url = `${API_BASE}/dispatches?${query.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch dispatches: ${res.statusText}`);
  }
  return res.json();
}

export async function createDispatch(payload: VehicleDispatchCreatePayload): Promise<VehicleDispatch> {
  const res = await fetch(`${API_BASE}/dispatches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to create dispatch: ${res.statusText}`);
  }
  return res.json();
}

export async function updateDispatch(
  id: number,
  payload: VehicleDispatchCreatePayload
): Promise<VehicleDispatch> {
  const res = await fetch(`${API_BASE}/dispatches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update dispatch: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteDispatch(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/dispatches/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete dispatch: ${res.statusText}`);
  }
}

export async function fetchMonthlyContracts(): Promise<import("./types").MonthlyVehicleContract[]> {
  const res = await fetch(`${API_BASE}/contracts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch monthly contracts: ${res.statusText}`);
  }
  return res.json();
}

export async function updateMonthlyContract(
  id: number,
  payload: import("./types").MonthlyVehicleContract
): Promise<import("./types").MonthlyVehicleContract> {
  const res = await fetch(`${API_BASE}/contracts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to update contract: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchOdometerLogs(params?: {
  vehicleId?: number;
  fromDate?: string;
  toDate?: string;
  billingMonth?: string;
}): Promise<import("./types").DailyOdometerLog[]> {
  const query = new URLSearchParams();
  if (params?.vehicleId) query.append("vehicle_id", params.vehicleId.toString());
  if (params?.fromDate) query.append("from_date", params.fromDate);
  if (params?.toDate) query.append("to_date", params.toDate);
  if (params?.billingMonth) query.append("billing_month", params.billingMonth);

  const res = await fetch(`${API_BASE}/odometer-logs?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch odometer logs: ${res.statusText}`);
  }
  return res.json();
}

export async function saveOdometerLog(
  payload: import("./types").DailyOdometerLogCreatePayload
): Promise<import("./types").DailyOdometerLog> {
  const res = await fetch(`${API_BASE}/odometer-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Failed to save odometer log: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMonthlyReconciliation(
  billingMonth: string
): Promise<import("./types").MonthlyReconciliationItem[]> {
  const res = await fetch(`${API_BASE}/reports/monthly-reconciliation?billing_month=${billingMonth}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch monthly reconciliation: ${res.statusText}`);
  }
  return res.json();
}

export async function exportVehicleExcel(
  providerType: "COMPANY_OWNED" | "OUTSOURCED",
  fromDate?: string,
  toDate?: string
): Promise<void> {
  const query = new URLSearchParams();
  query.append("provider_type", providerType);
  if (fromDate) query.append("from_date", fromDate);
  if (toDate) query.append("to_date", toDate);

  const res = await fetch(`${API_BASE}/export-excel?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Lỗi khi xuất báo cáo Excel: ${res.statusText}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = providerType === "COMPANY_OWNED"
    ? `Bao_Cao_3_Xe_Duc_Anh_${fromDate || ""}_den_${toDate || ""}.zip`
    : `Bang_Ke_Chuyen_Xe_Binh_An_${fromDate || ""}_den_${toDate || ""}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);

}


