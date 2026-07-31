import React from "react";

export type NavTab =
  | "EMPLOYEES"
  | "ACCOMMODATION"
  | "DAILY_PRESENCE"
  | "EXPIRING_DOCS"
  | "VEHICLE_MANAGEMENT"
  | "VEHICLE_DISPATCH"
  | "VEHICLE_ODOMETER"
  | "VEHICLE_CONTRACTS"
  | "MEAL_MANAGEMENT"
  | "HR_DOMESTIC_PLACEHOLDER"
  | "JANITOR_PROFILES"
  | "JANITOR_ATTENDANCE"
  | "EXPORT_LEGAL"
  | "EXPORT_PRESENCE"
  | "EXPORT_MEAL"
  | "EXPORT_JANITOR";

export interface NavItem {
  key: NavTab;
  label: string;
  icon: React.ReactNode;
}

export const hrForeignItems: NavItem[] = [
  {
    key: "EMPLOYEES",
    label: "Hồ Sơ",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    key: "ACCOMMODATION",
    label: "Chỗ ở & Lưu trú",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18" />
        <path d="M9 8h1" />
        <path d="M9 12h1" />
        <path d="M9 16h1" />
        <path d="M14 8h1" />
        <path d="M14 12h1" />
        <path d="M14 16h1" />
        <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      </svg>
    ),
  },
  {
    key: "DAILY_PRESENCE",
    label: "Thống kê Hiện diện",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    key: "EXPIRING_DOCS",
    label: "Cảnh báo Giấy tờ",
    icon: (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export const janitorItems: NavItem[] = [
  { key: "JANITOR_PROFILES", label: "Hồ Sơ", icon: <span className="text-xs">📋</span> },
  { key: "JANITOR_ATTENDANCE", label: "Điểm danh hàng ngày", icon: <span className="text-xs">📅</span> },
];

export const vehicleItems: NavItem[] = [
  { key: "VEHICLE_DISPATCH", label: "Nhật ký Điều xe", icon: <span className="text-xs">📅</span> },
  { key: "VEHICLE_ODOMETER", label: "Quãng đường di chuyển", icon: <span className="text-xs">📟</span> },
  { key: "VEHICLE_CONTRACTS", label: "Hợp đồng và bảng giá", icon: <span className="text-xs">📑</span> },
];

export const exportSubItems: NavItem[] = [
  { key: "EXPORT_LEGAL", label: "Hồ sơ người nước ngoài", icon: <span className="text-xs">📄</span> },
  { key: "EXPORT_PRESENCE", label: "Hiện diện KTX / Khách sạn", icon: <span className="text-xs">🏫</span> },
  { key: "EXPORT_MEAL", label: "Chi phí Bữa ăn", icon: <span className="text-xs">🍱</span> },
  { key: "EXPORT_JANITOR", label: "Chấm công & Lương Tạp vụ", icon: <span className="text-xs">🧹</span> },
];

export const exportItem: NavItem = {
  key: "EXPORT_LEGAL",
  label: "Xuất Báo cáo Excel",
  icon: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  ),
};
