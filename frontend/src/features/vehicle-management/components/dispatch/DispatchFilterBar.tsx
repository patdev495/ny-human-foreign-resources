import React from "react";
import { Plus, Search, Calendar, Filter } from "lucide-react";
import type { VehicleProvider } from "../../types";

interface DispatchFilterBarProps {
  fromDate: string;
  setFromDate: (val: string) => void;
  toDate: string;
  setToDate: (val: string) => void;
  providers: VehicleProvider[];
  selectedProviderFilter: string;
  setSelectedProviderFilter: (val: string) => void;
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
  providers,
  selectedProviderFilter,
  setSelectedProviderFilter,
  searchQuery,
  setSearchQuery,
  onSearchSubmit,
  onOpenModal,
}) => {
  const uniqueOutsourcedProviders = Array.from(
    new Map(
      providers
        .filter((p) => p.provider_type === "OUTSOURCED")
        .map((p) => [p.name, p])
    ).values()
  );

  return (
    <div className="executive-card p-4 flex flex-col gap-3">
      {/* Top Controls Bar */}
      <form onSubmit={onSearchSubmit} className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Unified Provider / Ownership Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedProviderFilter}
              onChange={(e) => setSelectedProviderFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 bg-white"
            >
              <option value="ALL">Tất cả Đơn vị & Nhóm xe</option>
              <option value="COMPANY_OWNED">Xe công ty (Đức Anh)</option>
              {uniqueOutsourcedProviders.length <= 1 ? (
                <option
                  value={
                    uniqueOutsourcedProviders.length === 1
                      ? `PROVIDER_${uniqueOutsourcedProviders[0].id}`
                      : "OUTSOURCED"
                  }
                >
                  Nhà xe Bình An (Theo chuyến)
                </option>
              ) : (
                <>
                  <option value="OUTSOURCED">Tất cả Xe thuê ngoài</option>
                  {uniqueOutsourcedProviders.map((p) => (
                    <option key={p.id} value={`PROVIDER_${p.id}`}>
                      &nbsp;&nbsp;&nbsp;↳ Nhà xe {p.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Manual Date Range Filter */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenModal}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo Đơn Điều Xe Mới</span>
          </button>
        </div>
      </form>

      {/* Bottom Search Bar */}
      <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo nhà xe, tài xế, hành khách, điểm đi/đến..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"
          />
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shrink-0"
        >
          Lọc kết quả
        </button>
      </form>
    </div>
  );
};

