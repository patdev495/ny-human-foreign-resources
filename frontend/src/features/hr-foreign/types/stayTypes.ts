export interface Stay {
  id: number;
  employee_id: number;
  accommodation_type: "KTX" | "HOTEL";
  room_id?: number | null;
  room_number?: string | null;
  hotel_id?: number | null;
  hotel_name?: string | null;
  hotel_room_number?: string | null;
  bed_location?: string | null;
  stay_type: "CO_DINH" | "CONG_TAC";
  has_meals: boolean;
  start_date?: string | null;
  expected_end_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface StayCreate {
  employee_id: number;
  accommodation_type: "KTX" | "HOTEL";
  room_id?: number | null;
  hotel_id?: number | null;
  hotel_room_number?: string | null;
  bed_location?: string | null;
  stay_type: "CO_DINH" | "CONG_TAC";
  has_meals: boolean;
  start_date?: string | null;
  expected_end_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface StayUpdate extends StayCreate {}

export interface StayCheckout {
  end_date: string;
}
