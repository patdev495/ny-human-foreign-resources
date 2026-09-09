import React from "react";
import { Users, UserCheck, PlaneLanding, AlertTriangle } from "lucide-react";
import type { ForeignEmployee } from "../../types";
import { getEmployeeDocStatuses } from "./DocBadge";
import { KpiCard } from "../../../../shared/components/KpiCard";

interface EmployeeStatCardsProps {
  employees: ForeignEmployee[];
  statusFilter: "ALL" | "IN_VN" | "RETURNED";
  setStatusFilter: (filter: "ALL" | "IN_VN" | "RETURNED") => void;
  docStatusFilter: "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK";
  setDocStatusFilter: (
    filter: "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK"
  ) => void;
  thresholdDays: number;
}

export const EmployeeStatCards: React.FC<EmployeeStatCardsProps> = ({
  employees,
  statusFilter,
  setStatusFilter,
  docStatusFilter,
  setDocStatusFilter,
  thresholdDays,
}) => {
  const totalCount = employees.length;
  const inVnCount = employees.filter((e) => e.is_in_vietnam).length;
  const returnedCount = employees.filter((e) => !e.is_in_vietnam).length;
  const warningDocCount = employees.filter((e) => {
    const s = getEmployeeDocStatuses(e, thresholdDays);
    return s.includes("expired") || s.includes("warning");
  }).length;

  const inVnPercent = totalCount > 0 ? Math.round((inVnCount / totalCount) * 100) : 0;
  const returnedPercent = totalCount > 0 ? Math.round((returnedCount / totalCount) * 100) : 0;
  const warningPercent = totalCount > 0 ? Math.round((warningDocCount / totalCount) * 100) : 0;

  const isAllActive = statusFilter === "ALL" && docStatusFilter === "ALL";
  const isInVnActive = statusFilter === "IN_VN" && docStatusFilter === "ALL";
  const isReturnedActive = statusFilter === "RETURNED" && docStatusFilter === "ALL";
  const isDocWarningActive =
    docStatusFilter === "HAS_WARNING" || docStatusFilter === "HAS_EXPIRED";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Tất cả nhân sự */}
      <KpiCard
        label="Tổng NS Nước ngoài"
        value={totalCount}
        sublabel="100% hồ sơ trong cơ sở dữ liệu"
        variant="indigo"
        icon={<Users className="h-5 w-5" />}
        active={isAllActive}
        badge={isAllActive ? "Đang chọn" : undefined}
        onClick={() => {
          setStatusFilter("ALL");
          setDocStatusFilter("ALL");
        }}
      />

      {/* Card 2: Đang ở VN */}
      <KpiCard
        label="Đang ở Việt Nam"
        value={inVnCount}
        sublabel={`${inVnPercent}% nhân sự đang lưu trú`}
        variant="emerald"
        icon={<UserCheck className="h-5 w-5" />}
        active={isInVnActive}
        badge={isInVnActive ? "Đang chọn" : undefined}
        onClick={() => {
          setStatusFilter("IN_VN");
          setDocStatusFilter("ALL");
        }}
      />

      {/* Card 3: Đã về nước */}
      <KpiCard
        label="Đã về nước"
        value={returnedCount}
        sublabel={`${returnedPercent}% đã xuất cảnh kết thúc đợt`}
        variant="rose"
        icon={<PlaneLanding className="h-5 w-5" />}
        active={isReturnedActive}
        badge={isReturnedActive ? "Đang chọn" : undefined}
        onClick={() => {
          setStatusFilter("RETURNED");
          setDocStatusFilter("ALL");
        }}
      />

      {/* Card 4: Cảnh báo giấy tờ */}
      <KpiCard
        label="Cảnh báo Giấy tờ"
        value={warningDocCount}
        sublabel={`${warningPercent}% hồ sơ cần xử lý (≤${thresholdDays} ngày)`}
        variant="amber"
        icon={<AlertTriangle className="h-5 w-5" />}
        active={isDocWarningActive}
        badge={isDocWarningActive ? "Cần chú ý" : undefined}
        onClick={() => {
          setDocStatusFilter("HAS_WARNING");
        }}
      />
    </div>
  );
};
