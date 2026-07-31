import React, { useState } from "react";
import { MealForecastBoard } from "./MealForecastBoard";
// import { MealExpenseReport } from "./MealExpenseReport";
import { MealConfigAndEvents } from "./MealConfigAndEvents";

export const MealManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"DAILY_FORECAST" | "CONFIG">(
    "DAILY_FORECAST"
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-sky-700 via-sky-600 to-blue-700 text-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-sky-400/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-2xl shrink-0 backdrop-blur-xs">
            🍱
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Quản lý & Thống kê Suất ăn</h1>
            <p className="text-xs text-sky-100/90 mt-1 max-w-3xl leading-relaxed">
              Dự báo & chốt suất ăn hằng ngày (Sáng & Tối), tổng hợp chi phí bữa ăn KTX & cấu hình đơn giá theo từng mốc thời gian / sự kiện.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-sky-950/25 backdrop-blur-xs p-1.5 rounded-xl border border-sky-400/30 shrink-0">
          <button
            onClick={() => setActiveTab("DAILY_FORECAST")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "DAILY_FORECAST"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-sky-100 hover:text-white hover:bg-white/15"
            }`}
          >
            🍱 Thống kê & Chốt Hằng ngày
          </button>
          <button
            onClick={() => setActiveTab("CONFIG")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "CONFIG"
                ? "bg-white text-sky-800 shadow-xs font-extrabold"
                : "text-sky-100 hover:text-white hover:bg-white/15"
            }`}
          >
            ⚙️ Cấu hình Đơn giá & Sự kiện
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {activeTab === "DAILY_FORECAST" && <MealForecastBoard />}
      {activeTab === "CONFIG" && <MealConfigAndEvents />}
    </div>
  );
};
