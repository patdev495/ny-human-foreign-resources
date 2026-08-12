import React from "react";
import type { ForeignEmployee } from "../../types";
import { getEmployeeDocStatuses } from "./DocBadge";

interface EmployeeStatCardsProps {
  employees: ForeignEmployee[];
  statusFilter: "ALL" | "IN_VN" | "RETURNED";
  setStatusFilter: (filter: "ALL" | "IN_VN" | "RETURNED") => void;
  docStatusFilter: "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK";
  setDocStatusFilter: (filter: "ALL" | "HAS_EXPIRED" | "HAS_WARNING" | "HAS_MISSING" | "ALL_OK") => void;
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

  const isAllActive = statusFilter === "ALL" && docStatusFilter === "ALL";
  const isInVnActive = statusFilter === "IN_VN" && docStatusFilter === "ALL";
  const isReturnedActive = statusFilter === "RETURNED" && docStatusFilter === "ALL";
  const isDocWarningActive = docStatusFilter === "HAS_WARNING" || docStatusFilter === "HAS_EXPIRED";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Card 1: Tất cả nhân sự */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter("ALL");
          setDocStatusFilter("ALL");
        }}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          isAllActive
            ? "bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Tổng NS Nước ngoài</span>
          {isAllActive && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-sky-100 text-sky-700 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-slate-800 font-mono block mt-1">
          {totalCount}
        </span>
        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">
          Tất cả hồ sơ lưu trú
        </span>
      </button>

      {/* Card 2: Đang ở VN */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter("IN_VN");
          setDocStatusFilter("ALL");
        }}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          isInVnActive
            ? "bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
            : "bg-emerald-50/50 border-emerald-200/80 hover:border-emerald-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-800">Đang ở VN</span>
          {isInVnActive && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-200 text-emerald-800 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-emerald-950 font-mono block mt-1">
          {inVnCount}
        </span>
        <span className="text-[11px] text-emerald-700 block mt-0.5 font-medium">
          Có mặt làm việc & lưu trú
        </span>
      </button>

      {/* Card 3: Đã về nước */}
      <button
        type="button"
        onClick={() => {
          setStatusFilter("RETURNED");
          setDocStatusFilter("ALL");
        }}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          isReturnedActive
            ? "bg-rose-50/90 border-rose-500 ring-2 ring-rose-500/20 shadow-sm"
            : "bg-rose-50/50 border-rose-200/80 hover:border-rose-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-rose-800">Đã về nước</span>
          {isReturnedActive && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-rose-200 text-rose-800 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-rose-950 font-mono block mt-1">
          {returnedCount}
        </span>
        <span className="text-[11px] text-rose-700 block mt-0.5 font-medium">
          Đã xuất cảnh / kết thúc đợt
        </span>
      </button>

      {/* Card 4: Cảnh báo giấy tờ */}
      <button
        type="button"
        onClick={() => {
          setDocStatusFilter("HAS_WARNING");
        }}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          isDocWarningActive
            ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
            : "bg-amber-50/50 border-amber-200/80 hover:border-amber-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800">Cảnh báo Giấy tờ</span>
          {isDocWarningActive && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-amber-950 font-mono block mt-1">
          {warningDocCount}
        </span>
        <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">
          Hết/Sắp hết hạn (≤{thresholdDays} ngày)
        </span>
      </button>
    </div>
  );
};
