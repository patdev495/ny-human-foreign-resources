import React, { useState } from "react";
import { EmployeeList } from "./features/hr-foreign/components/EmployeeList";
import { AccommodationManagement } from "./features/hr-foreign/components/AccommodationManagement";
import { ExpiringDocsAlert } from "./features/hr-foreign/components/ExpiringDocsAlert";
import { MealConfigAndEvents } from "./features/hr-foreign/components/MealConfigAndEvents";
import { MealExpenseReport } from "./features/hr-foreign/components/MealExpenseReport";
import { DailyPresenceReport } from "./features/hr-foreign/components/DailyPresenceReport";

export type NavTab =
  | "EMPLOYEES"
  | "ACCOMMODATION"
  | "DAILY_PRESENCE"
  | "EXPIRING_DOCS"
  | "MEAL_CONFIG"
  | "MEAL_REPORT";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("EMPLOYEES");

  const navItems: { key: NavTab; label: string; badge?: string }[] = [
    { key: "EMPLOYEES", label: "Hồ sơ Nhân sự" },
    { key: "ACCOMMODATION", label: "Quản lý Chỗ ở & Lưu trú" },
    { key: "DAILY_PRESENCE", label: "Thống kê Hiện diện", badge: "NEW" },
    { key: "EXPIRING_DOCS", label: "Cảnh báo Giấy tờ", badge: "HOT" },
    { key: "MEAL_CONFIG", label: "Cấu hình Giá & Sự kiện" },
    { key: "MEAL_REPORT", label: "Báo cáo Chi phí Bữa ăn" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-inner">
                NY
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">NY HR System</h1>
                <p className="text-xs text-slate-400">Quản lý Nhân sự Nước ngoài & KTX</p>
              </div>
            </div>
            <div className="text-xs font-semibold px-3 py-1 bg-slate-800 text-blue-400 border border-slate-700 rounded-full">
              Module: hr-foreign
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isActive ? "bg-amber-400 text-slate-900" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {activeTab === "EMPLOYEES" && <EmployeeList />}

        {activeTab === "ACCOMMODATION" && <AccommodationManagement />}

        {activeTab === "DAILY_PRESENCE" && <DailyPresenceReport />}

        {activeTab === "EXPIRING_DOCS" && <ExpiringDocsAlert />}

        {activeTab === "MEAL_CONFIG" && <MealConfigAndEvents />}

        {activeTab === "MEAL_REPORT" && <MealExpenseReport />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        NY Human Resources System &bull; Quản lý Nhân sự Nước ngoài (hr-foreign) &bull; SQL Server 2008 R2 Compatible
      </footer>
    </div>
  );
};

export default App;
