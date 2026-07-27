import React from "react";
import type { VehicleDispatch } from "../../types";

interface DispatchKpiBannerProps {
  dispatches: VehicleDispatch[];
}

export const DispatchKpiBanner: React.FC<DispatchKpiBannerProps> = ({ dispatches }) => {
  const totalCost = dispatches.reduce((sum, d) => sum + (d.cost || 0), 0);
  const outsourcedCount = dispatches.filter((d) => d.ownership_group === "OUTSOURCED").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider block">
            Tổng số chuyến điều xe
          </span>
          <span className="text-2xl font-bold text-blue-900">{dispatches.length} chuyến</span>
        </div>
        <span className="text-2xl">🚐</span>
      </div>

      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider block">
            Tổng chi phí điều xe
          </span>
          <span className="text-2xl font-bold text-emerald-900">
            {totalCost.toLocaleString("vi-VN")} đ
          </span>
        </div>
        <span className="text-2xl">💰</span>
      </div>

      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wider block">
            Xe thuê ngoài
          </span>
          <span className="text-2xl font-bold text-amber-900">{outsourcedCount} chuyến</span>
        </div>
        <span className="text-2xl">🚕</span>
      </div>
    </div>
  );
};
