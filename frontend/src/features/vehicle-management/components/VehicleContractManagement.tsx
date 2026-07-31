import React, { useState } from "react";
import { MonthlyContractList } from "./MonthlyContractList";
import { VendorRouteManagement } from "./VendorRouteManagement";

export type ContractSubTab = "MONTHLY_LEASE" | "VENDOR_ROUTES";

export const VehicleContractManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContractSubTab>("MONTHLY_LEASE");

  return (
    <div className="space-y-6">
      {/* Sleek Sub-tab Switcher Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl self-start">
          <button
            onClick={() => setActiveTab("MONTHLY_LEASE")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "MONTHLY_LEASE"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🏢</span> Xe khoán tháng (Đức Anh)
          </button>

          <button
            onClick={() => setActiveTab("VENDOR_ROUTES")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VENDOR_ROUTES"
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🛣️</span> Bảng giá Tuyến đường (Bình An...)
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500 hidden md:inline px-2">
          {activeTab === "MONTHLY_LEASE"
            ? "💡 Đơn giá thuê khoán tháng, hạn mức Km & phụ cấp ca đêm/cuối tuần"
            : "💡 Đơn giá cước theo tuyến cố định & chi phí KM/giờ chờ phát sinh"}
        </span>
      </div>

      {/* Contract Sub-tab Content */}
      {activeTab === "MONTHLY_LEASE" && <MonthlyContractList />}
      {activeTab === "VENDOR_ROUTES" && <VendorRouteManagement />}
    </div>
  );
};
