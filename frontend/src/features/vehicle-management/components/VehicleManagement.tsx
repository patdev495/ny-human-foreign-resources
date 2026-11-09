import { useEffect, useState } from "react";
import { VehicleContractManagement } from "./VehicleContractManagement";
import { VehicleStatsManagement } from "./VehicleStatsManagement";
import { VehicleDispatchList } from "./VehicleDispatchList";
import { EndShiftDemand } from "./EndShiftDemand";
import type { NavTab } from "../../../components/Sidebar";
import { SystemTabs } from "../../../shared/components/SystemTabs";

type SubTabKey = "DISPATCH" | "END_SHIFT" | "STATS" | "CONTRACTS";
const tabs: { key: SubTabKey; label: string; nav: NavTab; description: string }[] = [
  { key: "DISPATCH", label: "Nhật ký điều xe", nav: "VEHICLE_DISPATCH", description: "Lịch trình, tài xế và cước các chuyến điều xe." },
  { key: "END_SHIFT", label: "Điều xe tan làm", nav: "VEHICLE_END_SHIFT", description: "Xem khai báo giờ tan làm theo ngày để sắp xếp xe về KTX." },
  { key: "STATS", label: "Thống kê quãng đường", nav: "VEHICLE_STATS", description: "Bảng kê chuyến xe, quãng đường và giờ làm việc theo ngày." },
  { key: "CONTRACTS", label: "Hợp đồng & bảng giá", nav: "VEHICLE_CONTRACTS", description: "Hợp đồng khoán tháng, phương tiện và bảng giá tuyến đường của các nhà xe." },
];

interface VehicleManagementProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export function VehicleManagement({ activeTab, setActiveTab }: VehicleManagementProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTabKey>(() => tabs.find(tab => tab.nav === activeTab)?.key || "DISPATCH");
  useEffect(() => { if (activeTab) setActiveSubTab(tabs.find(tab => tab.nav === activeTab)?.key || "DISPATCH"); }, [activeTab]);
  const current = tabs.find(tab => tab.key === activeSubTab) || tabs[0];
  return <div className="space-y-4">
    <div><h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">{current.label}</h1><p className="mt-1 text-sm text-slate-500">{current.description}</p></div>
    <SystemTabs<SubTabKey> label="Quản lý xe" active={activeSubTab} items={tabs} onChange={key => {
      setActiveSubTab(key);
      const next = tabs.find(tab => tab.key === key);
      if (next) setActiveTab?.(next.nav);
    }} />
    {activeSubTab === "DISPATCH" && <VehicleDispatchList />}
    {activeSubTab === "END_SHIFT" && <EndShiftDemand />}
    {activeSubTab === "STATS" && <VehicleStatsManagement />}
    {activeSubTab === "CONTRACTS" && <VehicleContractManagement />}
  </div>;
}
