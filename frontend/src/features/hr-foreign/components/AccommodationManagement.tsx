import React, { useState } from "react";
import {
  Building2,
  LayoutGrid,
  Building,
  History,
  Home,
  Hotel,
} from "lucide-react";
import { RoomOccupancyBoard } from "./RoomOccupancyBoard";
import { RoomList } from "./RoomList";
import { HotelList } from "./HotelList";
import { StayList } from "./StayList";
import { ModuleHeader } from "../../../shared/components/ModuleHeader";

type MainTab = "OCCUPANCY" | "CATALOG" | "HISTORY";
type CatalogSubTab = "ROOMS" | "HOTELS";

export const AccommodationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>("OCCUPANCY");
  const [catalogSubTab, setCatalogSubTab] = useState<CatalogSubTab>("ROOMS");

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <ModuleHeader
        title="Quản lý Chỗ ở & Lưu trú"
        subtitle="Hợp nhất quản lý Ký túc xá (KTX) công ty và Khách sạn đối tác lưu trú cho nhân sự."
        icon={Building2}
        theme="indigo"
        tabs={[
          {
            key: "OCCUPANCY",
            label: "Sơ đồ hiện trạng",
            icon: <LayoutGrid className="h-3.5 w-3.5" />,
          },
          {
            key: "CATALOG",
            label: "Danh mục Chỗ ở",
            icon: <Building className="h-3.5 w-3.5" />,
          },
          {
            key: "HISTORY",
            label: "Lịch sử lưu trú",
            icon: <History className="h-3.5 w-3.5" />,
          },
        ]}
        activeTab={activeTab}
        onTabChange={(k) => setActiveTab(k as MainTab)}
      />

      {/* Tab Content */}
      {activeTab === "OCCUPANCY" && <RoomOccupancyBoard />}

      {activeTab === "CATALOG" && (
        <div className="space-y-6">
          {/* Subtabs for Catalog */}
          <div className="flex border-b border-slate-200 bg-white rounded-2xl px-6 pt-3 shadow-2xs">
            <button
              type="button"
              onClick={() => setCatalogSubTab("ROOMS")}
              className={`flex items-center gap-2 py-3 px-5 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                catalogSubTab === "ROOMS"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Phòng KTX công ty</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogSubTab("HOTELS")}
              className={`flex items-center gap-2 py-3 px-5 font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                catalogSubTab === "HOTELS"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Hotel className="h-4 w-4" />
              <span>Khách sạn đối tác</span>
            </button>
          </div>

          {catalogSubTab === "ROOMS" && <RoomList />}
          {catalogSubTab === "HOTELS" && <HotelList />}
        </div>
      )}

      {activeTab === "HISTORY" && <StayList />}
    </div>
  );
};
