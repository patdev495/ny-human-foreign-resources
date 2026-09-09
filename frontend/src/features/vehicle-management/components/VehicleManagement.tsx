import React, { useState, useEffect } from "react";
import { Car, Calendar, Gauge, FileText } from "lucide-react";
import { VehicleContractManagement } from "./VehicleContractManagement";
import { VehicleStatsManagement } from "./VehicleStatsManagement";
import { VehicleDispatchList } from "./VehicleDispatchList";
import type { NavTab } from "../../../components/Sidebar";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";

type SubTabKey = "DISPATCH" | "STATS" | "CONTRACTS";

interface VehicleManagementProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
}

export const VehicleManagement: React.FC<VehicleManagementProps> = ({
  activeTab,
  setActiveTab,
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

  const mapSubTabToNavTab = (sub: SubTabKey): NavTab => {
    switch (sub) {
      case "DISPATCH":
        return "VEHICLE_DISPATCH";
      case "STATS":
        return "VEHICLE_STATS";
      case "CONTRACTS":
        return "VEHICLE_CONTRACTS";
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

  const handleTabChange = (key: string) => {
    const sub = key as SubTabKey;
    setActiveSubTab(sub);
    setActiveTab?.(mapSubTabToNavTab(sub));
  };

  const getHeaderInfo = () => {
    switch (activeSubTab) {
      case "DISPATCH":
        return {
          title: "Nhật ký Điều xe",
          desc: "Theo dõi lịch trình các chuyến điều xe đưa đón nhân sự, đối chiếu cước xe và tài xế.",
        };
      case "STATS":
        return {
          title: "Thống kê & Quãng đường di chuyển",
          desc: "Báo cáo cước phí vận tải, ghi nhận chỉ số công tơ mét đầu/cuối ngày cho xe thuê khoán tháng.",
        };
      case "CONTRACTS":
        return {
          title: "Quản lý Hợp đồng & Nhà xe",
          desc: "Quản lý tập trung nhà xe đối tác, danh mục phương tiện, tài xế và bảng giá lộ trình.",
        };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <div className="space-y-6">
      <ModuleHeader
        title={headerInfo.title}
        subtitle={headerInfo.desc}
        icon={Car}
        theme="cyan"
        tabs={[
          {
            key: "DISPATCH",
            label: "Nhật ký Điều xe",
            icon: <Calendar className="h-3.5 w-3.5" />,
          },
          {
            key: "STATS",
            label: "Thống kê Quãng đường",
            icon: <Gauge className="h-3.5 w-3.5" />,
          },
          {
            key: "CONTRACTS",
            label: "Hợp đồng & Bảng giá",
            icon: <FileText className="h-3.5 w-3.5" />,
          },
        ]}
        activeTab={activeSubTab}
        onTabChange={handleTabChange}
      />

      {/* Sub-Tab Content */}
      {activeSubTab === "DISPATCH" && <VehicleDispatchList />}
      {activeSubTab === "STATS" && <VehicleStatsManagement />}
      {activeSubTab === "CONTRACTS" && <VehicleContractManagement />}
    </div>
  );
};
