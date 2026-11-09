import { useState } from "react";
import { MonthlyContractList } from "./MonthlyContractList";
import { VendorRouteManagement } from "./VendorRouteManagement";
import { SystemTabs } from "../../../shared/components/SystemTabs";

export type ContractSubTab = "MONTHLY_LEASE" | "VENDOR_ROUTES";

export function VehicleContractManagement() {
  const [activeTab, setActiveTab] = useState<ContractSubTab>("MONTHLY_LEASE");
  return <div className="space-y-4">
    <SystemTabs<ContractSubTab> label="Loại hợp đồng xe" active={activeTab} onChange={setActiveTab} items={[
      { key: "MONTHLY_LEASE", label: "Xe khoán tháng (Đức Anh)" }, { key: "VENDOR_ROUTES", label: "Bảng giá tuyến đường" },
    ]} />
    {activeTab === "MONTHLY_LEASE" && <MonthlyContractList />}
    {activeTab === "VENDOR_ROUTES" && <VendorRouteManagement />}
  </div>;
}
