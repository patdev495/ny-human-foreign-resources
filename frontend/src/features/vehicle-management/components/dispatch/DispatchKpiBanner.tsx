import React from "react";
import { Car, DollarSign, Building2 } from "lucide-react";
import type { VehicleDispatch } from "../../types";

interface DispatchKpiBannerProps {
  dispatches: VehicleDispatch[];
}

export const DispatchKpiBanner: React.FC<DispatchKpiBannerProps> = ({ dispatches }) => {
  const totalCost = dispatches.reduce((sum, d) => sum + (d.cost || 0), 0);
  const outsourcedCount = dispatches.filter((d) => d.ownership_group === "OUTSOURCED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="executive-card p-4.5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tổng số chuyến điều xe
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mono-metric">
            {dispatches.length} <span className="text-xs font-semibold text-slate-500">chuyến</span>
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
          <Car className="h-5 w-5" />
        </div>
      </div>

      <div className="executive-card p-4.5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Tổng chi phí cước điều xe
          </span>
          <div className="text-2xl font-extrabold text-emerald-700 mono-metric">
            {totalCost.toLocaleString("vi-VN")} <span className="text-xs font-semibold text-emerald-600">đ</span>
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
          <DollarSign className="h-5 w-5" />
        </div>
      </div>

      <div className="executive-card p-4.5 flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Xe thuê ngoài đối tác
          </span>
          <div className="text-2xl font-extrabold text-amber-700 mono-metric">
            {outsourcedCount} <span className="text-xs font-semibold text-amber-600">chuyến</span>
          </div>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
          <Building2 className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
};
