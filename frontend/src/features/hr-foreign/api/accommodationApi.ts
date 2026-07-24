import type {
  Hotel,
  HotelCreate,
  HotelUpdate,
  Room,
  RoomCreate,
  RoomOccupancy,
  RoomUpdate,
} from "../types";
import { BASE } from "./apiUtils";

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch(`${BASE}/rooms`);
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json() as Promise<Room[]>;
}

export async function fetchRoomOccupancy(): Promise<RoomOccupancy[]> {
  const res = await fetch(`${BASE}/rooms/occupancy`);
  if (!res.ok) throw new Error("Failed to fetch room occupancy");
  return res.json() as Promise<RoomOccupancy[]>;
}

export async function createRoom(payload: RoomCreate): Promise<Room> {
  const res = await fetch(`${BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create room");
  }
  return res.json() as Promise<Room>;
}

export async function updateRoom(
  id: number,
  payload: RoomUpdate
): Promise<Room> {
  const res = await fetch(`${BASE}/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update room");
  }
  return res.json() as Promise<Room>;
}

export async function deleteRoom(id: number): Promise<void> {
  const res = await fetch(`${BASE}/rooms/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete room");
}

export async function fetchHotels(): Promise<Hotel[]> {
  const res = await fetch(`${BASE}/hotels`);
  if (!res.ok) throw new Error("Failed to fetch hotels");
  return res.json() as Promise<Hotel[]>;
}

export async function createHotel(payload: HotelCreate): Promise<Hotel> {
  const res = await fetch(`${BASE}/hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create hotel");
  }
  return res.json() as Promise<Hotel>;
}

export async function updateHotel(id: number, payload: HotelUpdate): Promise<Hotel> {
  const res = await fetch(`${BASE}/hotels/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update hotel");
  }
  return res.json() as Promise<Hotel>;
}

export async function deleteHotel(id: number): Promise<void> {
  const res = await fetch(`${BASE}/hotels/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete hotel");
}
