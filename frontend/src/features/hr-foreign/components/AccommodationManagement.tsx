import { useState } from "react";
import { RoomOccupancyBoard } from "./RoomOccupancyBoard";
import { RoomList } from "./RoomList";
import { HotelList } from "./HotelList";
import { StayList } from "./StayList";
import { SystemTabs } from "../../../shared/components/SystemTabs";

type MainTab = "OCCUPANCY" | "CATALOG" | "HISTORY";
type CatalogSubTab = "ROOMS" | "HOTELS";

export function AccommodationManagement() {
  const [activeTab, setActiveTab] = useState<MainTab>("OCCUPANCY");
  const [catalogSubTab, setCatalogSubTab] = useState<CatalogSubTab>("ROOMS");
  return <div className="min-w-0 space-y-4">
    <h1 className="pb-1 text-xl font-semibold text-slate-900 sm:text-2xl">Chỗ ở & Lưu trú</h1>
    <SystemTabs label="Quản lý chỗ ở" active={activeTab} onChange={setActiveTab} items={[
      { key: "OCCUPANCY", label: "Hiện trạng chỗ ở" },
      { key: "CATALOG", label: "Danh mục chỗ ở" },
      { key: "HISTORY", label: "Lịch sử lưu trú" },
    ]} />
    {activeTab === "OCCUPANCY" && <RoomOccupancyBoard />}
    {activeTab === "CATALOG" && <div className="min-w-0 space-y-4">
      <SystemTabs label="Loại danh mục" active={catalogSubTab} onChange={setCatalogSubTab} items={[
        { key: "ROOMS", label: "Phòng KTX" }, { key: "HOTELS", label: "Khách sạn đối tác" },
      ]} />
      {catalogSubTab === "ROOMS" ? <RoomList /> : <HotelList />}
    </div>}
    {activeTab === "HISTORY" && <StayList />}
  </div>;
}
