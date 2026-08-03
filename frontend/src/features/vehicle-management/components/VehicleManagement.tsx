import React, { useState, useEffect } from "react";
import { VehicleContractManagement } from "./VehicleContractManagement";
import { VehicleStatsManagement } from "./VehicleStatsManagement";
import { VehicleDispatchList } from "./VehicleDispatchList";
import type { NavTab } from "../../../components/Sidebar";

type SubTabKey = "DISPATCH" | "STATS" | "CONTRACTS";

interface VehicleManagementProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export const VehicleManagement: React.FC<VehicleManagementProps> = ({
  activeTab,
}) => {
  const mapNavTabToSubTab = (tab?: NavTab): SubTabKey => {
    switch (tab) {
      case "VEHICLE_DISPATCH":
        return "DISPATCH";
      case "VEHICLE_STATS":
        return "STATS";
      case "VEHICLE_CONTRACTS":
        return "CONTRACTS";
      default:
        return "DISPATCH";
    }
  };

  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>(
    mapNavTabToSubTab(activeTab)
  );

  useEffect(() => {
    if (activeTab) {
      setActiveSubTab(mapNavTabToSubTab(activeTab));
    }
  }, [activeTab]);

  const getHeaderInfo = () => {
    switch (activeSubTab) {
      case "DISPATCH":
        return {
          icon: "📅",
          title: "Nhật ký Điều xe",
          desc: "Theo dõi nhật ký các chuyến điều xe đưa đón nhân sự, tra cứu lịch trình và chi phí cước xe.",
        };
      case "STATS":
        return {
          icon: "📊",
          title: "Thống kê & Quãng đường di chuyển",
          desc: "Báo cáo thống kê cước phí vận tải, ghi nhận chỉ số công tơ mét đầu/cuối ngày cho xe thuê khoán tháng (Đức Anh).",
        };
      case "CONTRACTS":
        return {
          icon: "📑",
          title: "Quản lý Hợp đồng & Nhà xe",
          desc: "Quản lý tập trung thông tin nhà xe, danh mục xe/lái xe, hợp đồng xe công ty (Đức Anh) và bảng giá tuyến đường Bình An.",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            {headerInfo.icon}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">{headerInfo.title}</h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">{headerInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* Sub-Tab Content */}
      {activeSubTab === "DISPATCH" && <VehicleDispatchList />}
      {activeSubTab === "STATS" && <VehicleStatsManagement />}
      {activeSubTab === "CONTRACTS" && <VehicleContractManagement />}
    </div>
  );
};

