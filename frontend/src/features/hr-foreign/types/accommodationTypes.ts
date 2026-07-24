export interface Room {
  id: number;
  room_number: string;
  notes?: string | null;
}

export interface RoomCreate {
  room_number: string;
  notes?: string | null;
}

export interface RoomUpdate extends RoomCreate {}

export interface Hotel {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface HotelCreate {
  name: string;
  address?: string | null;
  phone?: string | null;
  notes?: string | null;
}

export interface HotelUpdate extends HotelCreate {}

export interface ResidentInfo {
  employee_id: number;
  name_latin: string;
  name_chinese?: string | null;
  passport_number?: string | null;
  stay_id: number;
  stay_type: string;
  has_meals: boolean;
  bed_location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface RoomOccupancy {
  accommodation_type: "KTX" | "HOTEL";
  unit_id: number;
  unit_name: string;
  room_id?: number | null;
  room_number?: string | null;
  address?: string | null;
  notes?: string | null;
  active_residents: ResidentInfo[];
}
