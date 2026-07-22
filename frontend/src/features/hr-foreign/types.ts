/** TypeScript interfaces mirroring backend schemas for hr_foreign. */

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
  notes?: string | null;
  is_in_vietnam?: boolean;
  is_overdue_exit?: boolean;
  current_room_number?: string | null;
  // computed document expiry summaries
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
  notes?: string | null;
}

export interface ForeignEmployeeUpdate extends ForeignEmployeeCreate {}

export interface WorkPermit {
  id: number;
  employee_id: number;
  permit_number?: string | null;
  issue_date?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  issue_type?: string | null;
  notes?: string | null;
}

export interface WorkPermitCreate {
  permit_number?: string | null;
  issue_date?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
  issue_type?: string | null;
  notes?: string | null;
}

export interface WorkPermitUpdate extends WorkPermitCreate {}

export interface Contract {
  id: number;
  employee_id: number;
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface ContractCreate {
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface ContractUpdate extends ContractCreate {}

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

export interface Visa {
  id: number;
  stay_id: number;
  visa_type?: string | null;
  entry_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface VisaCreate {
  visa_type?: string | null;
  entry_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface VisaUpdate extends VisaCreate {}

export interface TamTru {
  id: number;
  stay_id: number;
  registration_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface TamTruCreate {
  registration_date?: string | null;
  expiry_date?: string | null;
  notes?: string | null;
}

export interface TamTruUpdate extends TamTruCreate {}

export interface ExpiringDocumentItem {
  id: number;
  stay_id?: number | null;
  employee_id: number;
  employee_name: string;
  passport_number?: string | null;
  doc_type: "VISA" | "TAM_TRU" | "GPLD" | "CONTRACT";
  type_name?: string | null;
  expiry_date?: string | null;
  days_remaining?: number | null;
}

export interface ExpiringDocumentsResponse {
  expiring_visas: ExpiringDocumentItem[];
  expiring_tam_trus: ExpiringDocumentItem[];
  expiring_gpl_ds?: ExpiringDocumentItem[];
  expiring_contracts?: ExpiringDocumentItem[];
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

export interface EmployeeHistoryResponse {
  employee: ForeignEmployee;
  work_permits: WorkPermit[];
  contracts: Contract[];
  stays: Stay[];
  visas: Visa[];
  tam_trus: TamTru[];
  travel_records: TravelRecord[];
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

export interface VisaTypeOption {
  code: string;
  name: string;
  description?: string;
}

export const VISA_TYPE_OPTIONS: VisaTypeOption[] = [
  { code: "DN1", name: "Visa Doanh nghiệp (Có pháp nhân)", description: "Cấp cho người làm việc với doanh nghiệp có tư cách pháp nhân" },
  { code: "DN2", name: "Visa Doanh nghiệp (Chào bán dịch vụ)", description: "Cấp cho người vào chào bán dịch vụ, thành lập đại diện" },
  { code: "LĐ1", name: "Visa Lao động (Miễn GPLĐ)", description: "Cấp cho người làm việc thuộc diện miễn Giấy phép lao động" },
  { code: "LĐ2", name: "Visa Lao động (Có GPLĐ)", description: "Cấp cho người làm việc thuộc diện phải có Giấy phép lao động" },
  { code: "ĐT1", name: "Visa Đầu tư (Vốn >= 100 tỷ)", description: "Nhà đầu tư vốn góp từ 100 tỷ VNĐ trở lên" },
  { code: "ĐT2", name: "Visa Đầu tư (Vốn 50 - <100 tỷ)", description: "Nhà đầu tư vốn góp từ 50 tỷ đến dưới 100 tỷ VNĐ" },
  { code: "ĐT3", name: "Visa Đầu tư (Vốn 3 - <50 tỷ)", description: "Nhà đầu tư vốn góp từ 3 tỷ đến dưới 50 tỷ VNĐ" },
  { code: "ĐT4", name: "Visa Đầu tư (Vốn < 3 tỷ)", description: "Nhà đầu tư vốn góp dưới 3 tỷ VNĐ" },
  { code: "TT", name: "Visa Thăm thân", description: "Cấp cho người thân (vợ/chồng/con) của NLĐ/Nhà đầu tư" },
  { code: "DL", name: "Visa Du lịch", description: "Cấp cho người vào du lịch" },
  { code: "NG", name: "Visa Ngoại giao", description: "Cấp cho thành viên cơ quan đại diện ngoại giao" },
  { code: "HH", name: "Visa Hội thảo / Công vụ", description: "Cấp cho người vào dự hội nghị, hội thảo" },
  { code: "EV", name: "Visa Điện tử (E-visa)", description: "Cấp qua hệ thống giao dịch điện tử" },
  { code: "SQ", name: "Visa Lãnh sự quán", description: "Cấp bởi Cơ quan đại diện Việt Nam ở nước ngoài" },
];

export function getVisaLabel(code?: string | null): string {
  if (!code) return "—";
  const trimmed = code.trim();
  const match = VISA_TYPE_OPTIONS.find((v) => v.code.toLowerCase() === trimmed.toLowerCase());
  if (match) {
    return `${match.code} - ${match.name}`;
  }
  return trimmed;
}

export type DocumentEntityType = "PASSPORT" | "VISA" | "TAM_TRU" | "WORK_PERMIT" | "CONTRACT";

export interface DocumentAttachment {
  id: number;
  entity_type: DocumentEntityType | string;
  entity_id: number;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}


