export interface ForeignEmployee {
  id: number;
  employee_code?: string | null;
  name_latin: string;
  name_chinese?: string | null;
  gender: string;
  nationality?: string | null;
  date_of_birth?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  entry_date?: string | null;
  expected_entry_date?: string | null;
  expected_exit_date?: string | null;
  actual_exit_date?: string | null;
  required_exit_date?: string | null;
  phone?: string | null;
  department?: string | null;
  role?: string | null;
  work_type?: "CO_DINH" | "CONG_TAC" | string;
  notes?: string | null;
  is_in_vietnam?: boolean;
  is_overdue_exit?: boolean;
  current_room_number?: string | null;
  latest_visa_expiry?: string | null;
  latest_visa_type?: string | null;
  latest_gpld_expiry?: string | null;
  latest_tamtru_expiry?: string | null;
  latest_contract_expiry?: string | null;
}

export interface ForeignEmployeeCreate {
  employee_code?: string | null;
  name_latin: string;
  name_chinese?: string | null;
  gender: string;
  nationality?: string | null;
  date_of_birth?: string | null;
  passport_number?: string | null;
  passport_expiry?: string | null;
  entry_date?: string | null;
  expected_exit_date?: string | null;
  actual_exit_date?: string | null;
  required_exit_date?: string | null;
  phone?: string | null;
  department?: string | null;
  role?: string | null;
  work_type?: "CO_DINH" | "CONG_TAC" | string;
  notes?: string | null;
}

export interface ForeignEmployeeUpdate extends ForeignEmployeeCreate {}

export interface TravelRecord {
  id: number;
  employee_id: number;
  entry_date?: string | null;
  expected_entry_date?: string | null;
  expected_exit_date?: string | null;
  actual_exit_date?: string | null;
  notes?: string | null;
}

export interface TravelRecordCreate {
  entry_date?: string | null;
  expected_entry_date?: string | null;
  expected_exit_date?: string | null;
  actual_exit_date?: string | null;
  notes?: string | null;
}

export interface TravelRecordUpdate extends TravelRecordCreate {}

export interface ExitDateActionPayload {
  actual_exit_date?: string | null;
  expected_exit_date?: string | null;
  expected_entry_date?: string | null;
  action_type?: "CHECK_OUT" | "KEEP_ROOM_ABSENCE";
  notes?: string | null;
}

export interface ExpiringDocumentItem {
  id?: number | null;
  stay_id?: number | null;
  employee_id: number;
  employee_name: string;
  passport_number?: string | null;
  doc_type: "VISA" | "TAM_TRU" | "GPLD" | "CONTRACT" | "PASSPORT";
  type_name?: string | null;
  expiry_date?: string | null;
  days_remaining?: number | null;
  is_missing_info?: boolean;
  missing_reason?: string | null;
}

export type ProfileTab = "HOP_DONG" | "GPLD" | "STAYS" | "VISA_TAM_TRU" | "PASSPORT" | "TRAVEL_RECORDS";

export interface ExpiringDocumentsResponse {
  expiring_visas: ExpiringDocumentItem[];
  expiring_tam_trus: ExpiringDocumentItem[];
  expiring_gpl_ds?: ExpiringDocumentItem[];
  expiring_contracts?: ExpiringDocumentItem[];
  expiring_passports?: ExpiringDocumentItem[];
}
