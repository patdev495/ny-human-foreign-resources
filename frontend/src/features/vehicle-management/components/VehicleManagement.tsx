import React, { useState } from "react";
import { VehicleDispatchList } from "./VehicleDispatchList";
import { VehicleList } from "./VehicleList";

export const VehicleManagement: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<"DISPATCH" | "VEHICLES">("DISPATCH");

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">🚐</span>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý xe & Chi phí Điều xe</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi nhật ký điều xe đưa đón, điểm đi/đến, chi phí thực tế và quản lý danh mục xe công ty & xe thuê ngoài.
          </p>
        </div>
      </div>

      {/* Main Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab("DISPATCH")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === "DISPATCH"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>📅</span> Nhật ký Điều xe
        </button>
        <button
          onClick={() => setActiveSubTab("VEHICLES")}
          className={`px-4 py-2.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
            activeSubTab === "VEHICLES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>🚗</span> Danh sách xe & Chi phí
        </button>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === "DISPATCH" && <VehicleDispatchList />}
      {activeSubTab === "VEHICLES" && <VehicleList />}
    </div>
  );
};
