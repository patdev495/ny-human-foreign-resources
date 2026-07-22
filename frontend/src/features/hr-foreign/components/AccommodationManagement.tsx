import React, { useState } from "react";
import { RoomOccupancyBoard } from "./RoomOccupancyBoard";
import { RoomList } from "./RoomList";
import { HotelList } from "./HotelList";
import { StayList } from "./StayList";

type MainTab = "OCCUPANCY" | "CATALOG" | "HISTORY";
type CatalogSubTab = "ROOMS" | "HOTELS";

export const AccommodationManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>("OCCUPANCY");
  const [catalogSubTab, setCatalogSubTab] = useState<CatalogSubTab>("ROOMS");

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg mr-3">
              🏠
            </span>
            Quản lý Chỗ ở & Lưu trú
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Hợp nhất quản lý Ký túc xá (KTX) và Khách sạn lưu trú cho nhân viên nước ngoài.
          </p>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab("OCCUPANCY")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "OCCUPANCY"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            📊 Sơ đồ hiện trạng
          </button>

          <button
            onClick={() => setActiveTab("CATALOG")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "CATALOG"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            🏢 Danh mục Chỗ ở
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            📜 Lịch sử lưu trú
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "OCCUPANCY" && <RoomOccupancyBoard />}

      {activeTab === "CATALOG" && (
        <div className="space-y-6">
          {/* Subtabs for Catalog */}
          <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-6 pt-3">
            <button
              onClick={() => setCatalogSubTab("ROOMS")}
              className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
                catalogSubTab === "ROOMS"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🏫 Phòng KTX công ty
            </button>
            <button
              onClick={() => setCatalogSubTab("HOTELS")}
              className={`py-3 px-5 font-semibold text-sm border-b-2 transition-colors ${
                catalogSubTab === "HOTELS"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              🏨 Khách sạn đối tác
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
