import React from "react";
import {
  Users,
  Building2,
  UserCheck,
  AlertTriangle,
  Sparkles,
  CalendarCheck,
  Car,
  Gauge,
  FileText,
  UtensilsCrossed,
  FileSpreadsheet,
  PlaneTakeoff,
} from "lucide-react";

export type NavTab =
  | "EMPLOYEES"
  | "ACCOMMODATION"
  | "DAILY_PRESENCE"
  | "EXPIRING_DOCS"
  | "VEHICLE_MANAGEMENT"
  | "VEHICLE_DISPATCH"
  | "VEHICLE_STATS"
  | "VEHICLE_CONTRACTS"
  | "MEAL_MANAGEMENT"
  | "HR_DOMESTIC_PLACEHOLDER"
  | "JANITOR_PROFILES"
  | "JANITOR_ATTENDANCE"
  | "EXPORT_LEGAL"
  | "EXPORT_PRESENCE"
  | "EXPORT_MEAL"
  | "EXPORT_JANITOR"
  | "EXPORT_VEHICLES"
  | "EXPORT_TRIP_DURATION";

export interface NavItem {
  key: NavTab;
  label: string;
  icon: React.ReactNode;
}

export const hrForeignItems: NavItem[] = [
  {
    key: "EMPLOYEES",
    label: "Hồ sơ nhân sự",
    icon: <Users className="h-4 w-4 shrink-0" />,
  },
  {
    key: "ACCOMMODATION",
    label: "Chỗ ở & Lưu trú",
    icon: <Building2 className="h-4 w-4 shrink-0" />,
  },
  {
    key: "DAILY_PRESENCE",
    label: "Thống kê Hiện diện",
    icon: <UserCheck className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPIRING_DOCS",
    label: "Cảnh báo Giấy tờ",
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  {
    key: "MEAL_MANAGEMENT",
    label: "Chi phí Bữa ăn",
    icon: <UtensilsCrossed className="h-4 w-4 shrink-0" />,
  },
];

export const janitorItems: NavItem[] = [
  {
    key: "JANITOR_PROFILES",
    label: "Hồ sơ Tạp vụ",
    icon: <Sparkles className="h-4 w-4 shrink-0" />,
  },
  {
    key: "JANITOR_ATTENDANCE",
    label: "Điểm danh hàng ngày",
    icon: <CalendarCheck className="h-4 w-4 shrink-0" />,
  },
];

export const vehicleItems: NavItem[] = [
  {
    key: "VEHICLE_DISPATCH",
    label: "Nhật ký Điều xe",
    icon: <Car className="h-4 w-4 shrink-0" />,
  },
  {
    key: "VEHICLE_STATS",
    label: "Thống kê Quãng đường",
    icon: <Gauge className="h-4 w-4 shrink-0" />,
  },
  {
    key: "VEHICLE_CONTRACTS",
    label: "Hợp đồng & Bảng giá",
    icon: <FileText className="h-4 w-4 shrink-0" />,
  },
];

export const exportSubItems: NavItem[] = [
  {
    key: "EXPORT_LEGAL",
    label: "Hồ sơ người nước ngoài",
    icon: <UserCheck className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPORT_PRESENCE",
    label: "Hiện diện KTX / Khách sạn",
    icon: <Building2 className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPORT_MEAL",
    label: "Chi phí Bữa ăn",
    icon: <UtensilsCrossed className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPORT_JANITOR",
    label: "Chấm công & Lương Tạp vụ",
    icon: <Sparkles className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPORT_VEHICLES",
    label: "Chi phí Thuê xe",
    icon: <Car className="h-4 w-4 shrink-0" />,
  },
  {
    key: "EXPORT_TRIP_DURATION",
    label: "Đợt Lưu trú & Xuất nhập cảnh",
    icon: <PlaneTakeoff className="h-4 w-4 shrink-0" />,
  },
];

export const exportItem: NavItem = {
  key: "EXPORT_LEGAL",
  label: "Xuất Báo Cáo Excel",
  icon: <FileSpreadsheet className="h-4 w-4 shrink-0" />,
};
