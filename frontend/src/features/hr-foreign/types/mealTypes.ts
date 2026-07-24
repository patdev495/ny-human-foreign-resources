export interface MealAbsence {
  id: number;
  stay_id: number;
  absence_date: string;
  meal_type?: "BREAKFAST" | "DINNER" | "ALL_DAY";
  reason?: string | null;
}

export interface MealAbsenceCreate {
  absence_date: string;
  meal_type?: "BREAKFAST" | "DINNER" | "ALL_DAY";
  reason?: string | null;
}

export interface MealSessionLock {
  id: number;
  lock_date: string;
  meal_session: "BREAKFAST" | "LUNCH" | "DINNER";
  calculated_meal_count: number;
  final_meal_count: number;
  locked_price_per_meal: number;
  locked_at: string;
  locked_by?: string | null;
  notes?: string | null;
}

export interface MealSessionLockCreate {
  lock_date: string;
  meal_session: "BREAKFAST" | "LUNCH" | "DINNER";
  calculated_meal_count: number;
  final_meal_count: number;
  locked_price_per_meal: number;
  locked_by?: string | null;
  notes?: string | null;
}

export interface DailyMealSessionSummary {
  meal_session: "BREAKFAST" | "LUNCH" | "DINNER";
  calculated_meal_count: number;
  is_locked: boolean;
  final_meal_count?: number | null;
  locked_price_per_meal?: number | null;
  locked_at?: string | null;
  notes?: string | null;
}

export interface DailyMealEmployeeItem {
  employee_id: number;
  employee_code?: string | null;
  name_latin: string;
  name_chinese?: string | null;
  accommodation_type: "KTX" | "HOTEL" | string;
  location_name: string;
  stay_id: number;
  has_meals: boolean;
  is_breakfast_absent: boolean;
  is_dinner_absent: boolean;
}

export interface DailyMealForecastResponse {
  date: string;
  day_type?: string;
  day_type_name?: string;
  suggested_price_per_meal?: number;
  suggested_breakfast_price?: number;
  suggested_dinner_price?: number;
  suggested_janitor_price?: number;
  event_notes?: string | null;
  breakfast: DailyMealSessionSummary;
  lunch: DailyMealSessionSummary;
  dinner: DailyMealSessionSummary;
  active_ktx_residents_count: number;
  employees: DailyMealEmployeeItem[];
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

export interface EventDayCreateBatch {
  start_date?: string | null;
  end_date?: string | null;
  event_type: string;
  notes?: string | null;
}

export interface MealPriceConfig {
  id: number;
  day_type: string;
  day_type_name?: string | null;
  foreign_breakfast_price: number;
  foreign_dinner_price: number;
  janitor_meal_price: number;
  effective_from: string;
  notes?: string | null;
}

export interface MealPriceConfigCreate {
  day_type: string;
  day_type_name?: string | null;
  foreign_breakfast_price: number;
  foreign_dinner_price: number;
  janitor_meal_price: number;
  effective_from?: string;
  notes?: string | null;
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

export interface JanitorDailyItem {
  date: string;
  meal_count: number;
  price_per_meal: number;
  total_cost: number;
  notes?: string | null;
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
  janitor_items?: JanitorDailyItem[];
  total_janitor_meals?: number;
  total_janitor_expense?: number;
}


export interface DailyPresenceItem {
  employee_id: number;
  employee_code?: string | null;
  name_latin: string;
  name_chinese?: string | null;
  gender: string;
  department?: string | null;
  phone?: string | null;
  accommodation_type: "KTX" | "HOTEL";
  location_name: string;
  room_number?: string | null;
  hotel_name?: string | null;
  hotel_room_number?: string | null;
  bed_location?: string | null;
  stay_id?: number | null;
  stay_type?: string | null;
  start_date?: string | null;
  expected_end_date?: string | null;
  actual_exit_date?: string | null;
  expected_entry_date?: string | null;
  notes?: string | null;
}

export interface DailyPresenceSummary {
  total_in_vn: number;
  ktx_count: number;
  hotel_count: number;
  unassigned_count?: number;
  exited_count?: number;
}

export interface DailyPresenceGroup {
  group_name: string;
  count: number;
  items: DailyPresenceItem[];
}

export interface DailyPresenceReportResponse {
  target_date: string;
  summary: DailyPresenceSummary;
  ktx_groups: DailyPresenceGroup[];
  hotel_groups: DailyPresenceGroup[];
  unassigned_items?: DailyPresenceItem[];
  exited_items?: DailyPresenceItem[];
  items: DailyPresenceItem[];
}
