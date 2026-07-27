import React from "react";
import type { OwnershipGroup } from "../../types";

interface DispatchFilterBarProps {
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
  ownershipFilter: OwnershipGroup | "ALL";
  setOwnershipFilter: (val: OwnershipGroup | "ALL") => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onOpenModal: () => void;
}

export const DispatchFilterBar: React.FC<DispatchFilterBarProps> = ({
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  ownershipFilter,
  setOwnershipFilter,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenModal,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
      <form onSubmit={onSearchSubmit} className="flex flex-wrap items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600">Từ ngày:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-600">Đến ngày:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value as OwnershipGroup | "ALL")}
          className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="ALL">Tất cả xe</option>
          <option value="COMPANY_OWNED">🏢 Xe công ty</option>
          <option value="OUTSOURCED">🚕 Xe thuê ngoài</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm hành khách, tài xế, điểm đi/đến..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
        </div>

        <button
          type="submit"
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
        >
          Lọc
        </button>
      </form>

      <button
        onClick={onOpenModal}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
      >
        <span>🚐</span> Tạo Đơn Điều xe mới
      </button>
    </div>
  );
};
