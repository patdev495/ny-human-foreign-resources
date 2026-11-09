import { useState } from "react";
import { DucAnhStats } from "./stats/DucAnhStats";
import { BinhAnStats } from "./stats/BinhAnStats";
import { SystemTabs } from "../../../shared/components/SystemTabs";

export type StatsSubTab = "DUC_ANH" | "BINH_AN";

export function VehicleStatsManagement() {
  const [activeTab, setActiveTab] = useState<StatsSubTab>("DUC_ANH");
  return <div className="space-y-4">
    <SystemTabs<StatsSubTab> label="Nhóm xe thống kê" active={activeTab} onChange={setActiveTab} items={[
      { key: "DUC_ANH", label: "Xe công ty (Đức Anh)" }, { key: "BINH_AN", label: "Xe thuê ngoài (Bình An)" },
    ]} />
    {activeTab === "DUC_ANH" && <DucAnhStats />}
    {activeTab === "BINH_AN" && <BinhAnStats />}
  </div>;
}
