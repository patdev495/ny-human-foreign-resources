import React from "react";
import type { ForeignEmployee } from "../../types";

interface JanitorStatCardsProps {
  employees: ForeignEmployee[];
  locationFilter?: string;
  setLocationFilter?: (loc: string) => void;
}

export const JanitorStatCards: React.FC<JanitorStatCardsProps> = ({
  employees,
  locationFilter = "ALL",
  setLocationFilter,
}) => {
  const countKTX = employees.filter((e) => (e.workplace_location || "DORMITORY") === "DORMITORY").length;
  const countCN09 = employees.filter((e) => e.workplace_location === "CN09").length;
  const countCN15 = employees.filter((e) => e.workplace_location === "CN15").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {/* Card 1: Tổng tạp vụ */}
      <button
        type="button"
        onClick={() => setLocationFilter?.("ALL")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          locationFilter === "ALL"
            ? "bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
            : "bg-white border-slate-200 hover:border-slate-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">Tổng Tạp vụ</span>
          {locationFilter === "ALL" && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-sky-100 text-sky-700 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-slate-800 font-mono block mt-1">
          {employees.length}
        </span>
        <span className="text-[11px] text-slate-400 block mt-0.5 font-medium">Nhân sự hiện có</span>
      </button>

      {/* Card 2: KTX */}
      <button
        type="button"
        onClick={() => setLocationFilter?.("DORMITORY")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          locationFilter === "DORMITORY"
            ? "bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
            : "bg-amber-50/50 border-amber-200/80 hover:border-amber-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-800">Tạp vụ KTX</span>
          {locationFilter === "DORMITORY" && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-200 text-amber-900 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-amber-950 font-mono block mt-1">
          {countKTX}
        </span>
        <span className="text-[11px] text-amber-700 block mt-0.5 font-medium">Được tính tiền ăn KTX</span>
      </button>

      {/* Card 3: CN09 */}
      <button
        type="button"
        onClick={() => setLocationFilter?.("CN09")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          locationFilter === "CN09"
            ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
            : "bg-blue-50/50 border-blue-200/80 hover:border-blue-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-800">Tạp vụ CN09</span>
          {locationFilter === "CN09" && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-200 text-blue-900 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-blue-950 font-mono block mt-1">
          {countCN09}
        </span>
        <span className="text-[11px] text-blue-700 block mt-0.5 font-medium">Nhà máy CN09</span>
      </button>

      {/* Card 4: CN15 */}
      <button
        type="button"
        onClick={() => setLocationFilter?.("CN15")}
        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden ${
          locationFilter === "CN15"
            ? "bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm"
            : "bg-indigo-50/50 border-indigo-200/80 hover:border-indigo-300 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-indigo-800">Tạp vụ CN15</span>
          {locationFilter === "CN15" && (
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-200 text-indigo-900 rounded-full">
              ✓ Chọn
            </span>
          )}
        </div>
        <span className="text-2xl font-extrabold text-indigo-950 font-mono block mt-1">
          {countCN15}
        </span>
        <span className="text-[11px] text-indigo-700 block mt-0.5 font-medium">Nhà máy CN15</span>
      </button>
    </div>
  );
};
