/** TypeScript interfaces mirroring backend schemas for hr_foreign. */

export interface ForeignEmployee {
  id: number;
  name_latin: string;
  name_chinese?: string | null;
  gender: string;
  nationality?: string | null;
  date_of_birth?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  required_exit_date?: string | null;
  phone?: string | null;
  department?: string | null;
  role?: string | null;
  notes?: string | null;
  is_in_vietnam?: boolean;
  current_room_number?: string | null;
}

export interface ForeignEmployeeCreate {
  name_latin: string;
  name_chinese?: string | null;
  gender: string;
  nationality?: string | null;
  date_of_birth?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  required_exit_date?: string | null;
  phone?: string | null;
  department?: string | null;
  role?: string | null;
  notes?: string | null;
}

export interface ForeignEmployeeUpdate extends ForeignEmployeeCreate {}

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

export interface Stay {
  id: number;
  employee_id: number;
  accommodation_type: "KTX" | "HOTEL";
  room_id?: number | null;
  room_number?: string | null;
  bed_location?: string | null;
  stay_type: "CO_DINH" | "CONG_TAC";
  has_meals: boolean;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface StayCreate {
  employee_id: number;
  accommodation_type: "KTX" | "HOTEL";
  room_id?: number | null;
  bed_location?: string | null;
  stay_type: "CO_DINH" | "CONG_TAC";
  has_meals: boolean;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface StayUpdate extends StayCreate {}

export interface ResidentInfo {
  employee_id: number;
  name_latin: string;
  name_chinese?: string | null;
  passport_number?: string | null;
  stay_id: number;
  stay_type: string;
  has_meals: boolean;
  bed_location?: string | null;
  start_date: string;
  end_date?: string | null;
}

export interface RoomOccupancy {
  room_id: number;
  room_number: string;
  notes?: string | null;
  active_residents: ResidentInfo[];
}

export interface Visa {
  id: number;
  stay_id: number;
  visa_type: string;
  entry_date: string;
  expiry_date: string;
  notes?: string | null;
}

export interface VisaCreate {
  visa_type: string;
  entry_date: string;
  expiry_date: string;
  notes?: string | null;
}

export interface TamTru {
  id: number;
  stay_id: number;
  registration_date: string;
  expiry_date: string;
  notes?: string | null;
}

export interface TamTruCreate {
  registration_date: string;
  expiry_date: string;
  notes?: string | null;
}

export interface ExpiringDocumentItem {
  id: number;
  stay_id: number;
  employee_id: number;
  employee_name: string;
  passport_number?: string | null;
  doc_type: "VISA" | "TAM_TRU";
  type_name: string;
  expiry_date: string;
  days_remaining: number;
}

export interface ExpiringDocumentsResponse {
  expiring_visas: ExpiringDocumentItem[];
  expiring_tam_trus: ExpiringDocumentItem[];
}

export interface MealAbsence {
  id: number;
  stay_id: number;
  absence_date: string;
  reason?: string | null;
}

export interface MealAbsenceCreate {
  absence_date: string;
  reason?: string | null;
}

export interface EventDay {
  id: number;
  event_date: string;
  event_type: string;
  notes?: string | null;
}

export interface EventDayCreate {
  event_date: string;
  event_type?: string;
  notes?: string | null;
}

export interface MealPriceConfig {
  id: number;
  day_type: "NORMAL" | "PRESIDENT_VISIT" | string;
  price_per_meal: number;
  effective_from: string;
}

export interface MealPriceConfigCreate {
  day_type: "NORMAL" | "PRESIDENT_VISIT" | string;
  price_per_meal: number;
  effective_from: string;
}

export interface MealExpenseReportItem {
  employee_id: number;
  employee_name: string;
  name_chinese?: string | null;
  passport_number?: string | null;
  room_number: string;
  stay_days: number;
  absent_days: number;
  meal_days: number;
  normal_days: number;
  event_days: number;
  meal_count: number;
  total_cost: number;
}

export interface MealExpenseReportResponse {
  start_date: string;
  end_date: string;
  total_employees: number;
  total_stay_days: number;
  total_meal_days: number;
  total_meals: number;
  total_expense: number;
  items: MealExpenseReportItem[];
}

export interface EmployeeHistoryResponse {
  employee: ForeignEmployee;
  stays: Stay[];
  visas: Visa[];
  tam_trus: TamTru[];
}
