import React, { useState } from "react";
import { Building2, Route, Info } from "lucide-react";
import { MonthlyContractList } from "./MonthlyContractList";
import { VendorRouteManagement } from "./VendorRouteManagement";

export type ContractSubTab = "MONTHLY_LEASE" | "VENDOR_ROUTES";

export const VehicleContractManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ContractSubTab>("MONTHLY_LEASE");

  return (
    <div className="space-y-6">
      {/* Sleek Sub-tab Switcher Bar */}
      <div className="executive-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100/90 p-1.5 rounded-xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab("MONTHLY_LEASE")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "MONTHLY_LEASE"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/90"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className={`h-4 w-4 ${activeTab === "MONTHLY_LEASE" ? "text-indigo-600" : "text-slate-400"}`} />
            <span>Xe khoán tháng (Đức Anh)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("VENDOR_ROUTES")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "VENDOR_ROUTES"
                ? "bg-white text-indigo-700 shadow-sm border border-slate-200/90"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Route className={`h-4 w-4 ${activeTab === "VENDOR_ROUTES" ? "text-indigo-600" : "text-slate-400"}`} />
            <span>Bảng giá Tuyến đường (Bình An...)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 hidden md:flex px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60">
          <Info className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span>
            {activeTab === "MONTHLY_LEASE"
              ? "Đơn giá thuê khoán tháng, hạn mức Km & phụ cấp ca đêm/cuối tuần"
              : "Đơn giá cước theo tuyến cố định & chi phí KM/giờ chờ phát sinh"}
          </span>
        </div>
      </div>

      {/* Contract Sub-tab Content */}
      {activeTab === "MONTHLY_LEASE" && <MonthlyContractList />}
      {activeTab === "VENDOR_ROUTES" && <VendorRouteManagement />}
    </div>
  );
};
