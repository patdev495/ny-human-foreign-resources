import type { ForeignEmployee } from "./employeeTypes";
import type { Stay } from "./stayTypes";

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
  contract_number?: string | null;
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface ContractCreate {
  contract_number?: string | null;
  contract_type?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
}

export interface ContractUpdate extends ContractCreate {}

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

export interface DocWarningConfigItem {
  id: number;
  doc_type: "VISA" | "TAM_TRU" | "GPLD" | "CONTRACT" | "PASSPORT";
  warning_value: number;
  warning_unit: "DAY" | "MONTH";
}

export interface DocWarningConfigUpdateItem {
  doc_type: "VISA" | "TAM_TRU" | "GPLD" | "CONTRACT" | "PASSPORT";
  warning_value: number;
  warning_unit: "DAY" | "MONTH";
}

export interface DocWarningConfigResponse {
  configs: DocWarningConfigItem[];
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

export interface EmployeeHistoryResponse {
  employee: ForeignEmployee;
  work_permits: WorkPermit[];
  contracts: Contract[];
  stays: Stay[];
  visas: Visa[];
  tam_trus: TamTru[];
  travel_records: any[];
}
