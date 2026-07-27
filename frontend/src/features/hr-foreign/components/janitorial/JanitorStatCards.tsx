import React from "react";
import type { ForeignEmployee } from "../../types";

interface JanitorStatCardsProps {
  employees: ForeignEmployee[];
}

export const JanitorStatCards: React.FC<JanitorStatCardsProps> = ({ employees }) => {
  const countKTX = employees.filter((e) => (e.workplace_location || "DORMITORY") === "DORMITORY").length;
  const countCN09 = employees.filter((e) => e.workplace_location === "CN09").length;
  const countCN15 = employees.filter((e) => e.workplace_location === "CN15").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <span className="text-xs font-semibold text-slate-500 block mb-1">Tổng Tạp vụ</span>
        <span className="text-2xl font-extrabold text-slate-800 font-mono">{employees.length}</span>
        <span className="text-[10px] text-slate-400 block mt-0.5">Nhân sự hiện có</span>
      </div>
      <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs">
        <span className="text-xs font-semibold text-amber-800 block mb-1">Tạp vụ KTX</span>
        <span className="text-2xl font-extrabold text-amber-900 font-mono">{countKTX}</span>
        <span className="text-[10px] text-amber-700 block mt-0.5">Được tính tiền ăn KTX</span>
      </div>
      <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs">
        <span className="text-xs font-semibold text-blue-800 block mb-1">Tạp vụ CN09</span>
        <span className="text-2xl font-extrabold text-blue-900 font-mono">{countCN09}</span>
        <span className="text-[10px] text-blue-700 block mt-0.5">Nhà máy CN09</span>
      </div>
      <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-200 shadow-2xs">
        <span className="text-xs font-semibold text-indigo-800 block mb-1">Tạp vụ CN15</span>
        <span className="text-2xl font-extrabold text-indigo-900 font-mono">{countCN15}</span>
        <span className="text-[10px] text-indigo-700 block mt-0.5">Nhà máy CN15</span>
      </div>
    </div>
  );
};
