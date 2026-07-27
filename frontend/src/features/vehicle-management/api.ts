import type {
  OwnershipGroup,
  Vehicle,
  VehicleCreatePayload,
  VehicleDispatch,
  VehicleDispatchCreatePayload,
} from "./types";


const API_BASE = "/api/vehicle-management";

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
  search?: string;
}): Promise<VehicleDispatch[]> {
  const query = new URLSearchParams();
  if (params?.fromDate) query.append("from_date", params.fromDate);
  if (params?.toDate) query.append("to_date", params.toDate);
  if (params?.ownershipGroup) query.append("ownership_group", params.ownershipGroup);
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
