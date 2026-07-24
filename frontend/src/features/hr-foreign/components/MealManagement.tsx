import React, { useState } from "react";
import { MealForecastBoard } from "./MealForecastBoard";
import { MealExpenseReport } from "./MealExpenseReport";
import { MealConfigAndEvents } from "./MealConfigAndEvents";

export const MealManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"DAILY_FORECAST" | "REPORT" | "CONFIG">(
    "DAILY_FORECAST"
  );

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg text-lg">🍱</span>
            <h1 className="text-2xl font-bold text-slate-800">Quản lý & Thống kê Suất ăn</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dự báo & chốt suất ăn hằng ngày (Sáng & Tối), tổng hợp chi phí bữa ăn KTX & cấu hình đơn giá theo từng mốc thời gian / sự kiện.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab("DAILY_FORECAST")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "DAILY_FORECAST"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🍱 Thống kê & Chốt Hằng ngày
          </button>
          <button
            onClick={() => setActiveTab("REPORT")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "REPORT"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            📊 Báo cáo Chi phí Bữa ăn
          </button>
          <button
            onClick={() => setActiveTab("CONFIG")}
            className={`px-3.5 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "CONFIG"
                ? "bg-white text-blue-700 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ⚙️ Cấu hình Đơn giá & Sự kiện
          </button>
        </div>
      </div>

      {/* Render selected view */}
      {activeTab === "DAILY_FORECAST" && <MealForecastBoard />}
      {activeTab === "REPORT" && <MealExpenseReport />}
      {activeTab === "CONFIG" && <MealConfigAndEvents />}
    </div>
  );
};
