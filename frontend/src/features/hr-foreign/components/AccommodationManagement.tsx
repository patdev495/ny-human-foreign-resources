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
      {/* Top Header Banner */}
      <div className="workspace-module-header workspace-accommodation bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            🏠
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Quản lý Chỗ ở & Lưu trú</h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">
              Hợp nhất quản lý Ký túc xá (KTX) và Khách sạn lưu trú cho nhân viên nước ngoài.
            </p>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="flex items-center space-x-1 bg-sky-950/25 backdrop-blur-xs p-1.5 rounded-xl border border-sky-400/30 shrink-0">
          <button
            onClick={() => setActiveTab("OCCUPANCY")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "OCCUPANCY"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-sky-100 hover:text-white hover:bg-white/15"
            }`}
          >
            📊 Sơ đồ hiện trạng
          </button>

          <button
            onClick={() => setActiveTab("CATALOG")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "CATALOG"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-sky-100 hover:text-white hover:bg-white/15"
            }`}
          >
            🏢 Danh mục Chỗ ở
          </button>

          <button
            onClick={() => setActiveTab("HISTORY")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === "HISTORY"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-sky-100 hover:text-white hover:bg-white/15"
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
