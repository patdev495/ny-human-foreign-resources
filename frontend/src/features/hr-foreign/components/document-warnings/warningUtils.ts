import type { DocWarningConfigUpdateItem, ExpiringDocumentItem, ExpiringDocumentsResponse, ProfileTab } from "../../types";

export type DocumentType = ExpiringDocumentItem["doc_type"];
export type WarningStatus = "EXPIRED" | "EXPIRING" | "MISSING";
export type WarningFilter = "ALL" | WarningStatus;
export type WarningConfigValues = Record<DocumentType, Pick<DocWarningConfigUpdateItem, "warning_value" | "warning_unit">>;

export const warningDocuments: { type: DocumentType; label: string; responseKey: keyof ExpiringDocumentsResponse; tab: ProfileTab }[] = [
  { type: "VISA", label: "Visa", responseKey: "expiring_visas", tab: "VISA_TAM_TRU" },
  { type: "TAM_TRU", label: "Tạm trú", responseKey: "expiring_tam_trus", tab: "VISA_TAM_TRU" },
  { type: "GPLD", label: "Giấy phép lao động", responseKey: "expiring_gpl_ds", tab: "GPLD" },
  { type: "CONTRACT", label: "Hợp đồng lao động", responseKey: "expiring_contracts", tab: "HOP_DONG" },
  { type: "PASSPORT", label: "Hộ chiếu", responseKey: "expiring_passports", tab: "PASSPORT" },
];

export function defaultWarningConfigs(): WarningConfigValues {
  return {
    VISA: { warning_value: 30, warning_unit: "DAY" },
    TAM_TRU: { warning_value: 30, warning_unit: "DAY" },
    GPLD: { warning_value: 30, warning_unit: "DAY" },
    CONTRACT: { warning_value: 30, warning_unit: "DAY" },
    PASSPORT: { warning_value: 30, warning_unit: "DAY" },
  };
}

export function warningThreshold(config: WarningConfigValues[DocumentType]): string {
  return `${config.warning_value} ${config.warning_unit === "MONTH" ? "tháng" : "ngày"}`;
}

export function documentWarningStatus(item: ExpiringDocumentItem): WarningStatus {
  if (item.is_missing_info || item.days_remaining == null || !item.expiry_date) return "MISSING";
  return item.days_remaining < 0 ? "EXPIRED" : "EXPIRING";
}

export function documentWarningText(item: ExpiringDocumentItem): string {
  const status = documentWarningStatus(item);
  if (status === "MISSING") return "Thiếu thông tin";
  if (status === "EXPIRED") return `Quá hạn ${Math.abs(item.days_remaining ?? 0)} ngày`;
  return item.days_remaining === 0 ? "Hết hạn hôm nay" : `Còn ${item.days_remaining} ngày`;
}
