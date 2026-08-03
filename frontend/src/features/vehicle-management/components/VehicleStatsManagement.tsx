import React, { useState } from "react";
import { DucAnhStats } from "./stats/DucAnhStats";
import { BinhAnStats } from "./stats/BinhAnStats";

export type StatsSubTab = "DUC_ANH" | "BINH_AN";

export const VehicleStatsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StatsSubTab>("DUC_ANH");

  return (
    <div className="space-y-6">
      {/* Sub-tab Switcher Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("DUC_ANH")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "DUC_ANH"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🏢</span> Xe công ty (Đức Anh)
          </button>

          <button
            onClick={() => setActiveTab("BINH_AN")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "BINH_AN"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🚕</span> Nhà xe Bình An
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 hidden md:inline px-2">
          {activeTab === "DUC_ANH"
            ? "💡 Danh sách chuyến điều xe Đức Anh, chốt số KM Odometer & Báo cáo đối chiếu cước tháng"
            : "💡 Tổng hợp bảng kê chi tiết các chuyến đi & Chi phí cước phát sinh của Nhà xe Bình An theo tháng"}
        </span>
      </div>

      {/* Tab Contents */}
      {activeTab === "DUC_ANH" && <DucAnhStats />}
      {activeTab === "BINH_AN" && <BinhAnStats />}
    </div>
  );
};
