import React, { useState } from "react";
import { EmployeeList } from "./features/hr-foreign/components/EmployeeList";
import { AccommodationManagement } from "./features/hr-foreign/components/AccommodationManagement";
import { ExpiringDocsAlert } from "./features/hr-foreign/components/ExpiringDocsAlert";
import { MealManagement } from "./features/hr-foreign/components/MealManagement";
import { VehicleManagement } from "./features/vehicle-management/components/VehicleManagement";
import { DailyPresenceReport } from "./features/hr-foreign/components/DailyPresenceReport";
import { ReportHub } from "./features/hr-foreign/components/ReportHub";
import { JanitorialHrManagement } from "./features/hr-foreign/components/JanitorialHrManagement";
import { Sidebar } from "./components/Sidebar";
import type { NavTab } from "./components/Sidebar";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("EMPLOYEES");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSidebarOpen(!isSidebarOpen);
                  setIsMobileOpen(!isMobileOpen);
                }}
                title={isSidebarOpen ? "Thu gọn Sidebar" : "Mở rộng Sidebar"}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xl text-white shadow-inner">
                  NY
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold tracking-tight">NY HR System</h1>
                  <p className="text-xs text-slate-400">Hệ thống Quản lý Nhân sự Tập đoàn NY</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex text-xs font-semibold px-3 py-1 bg-slate-800 text-blue-400 border border-slate-700 rounded-full">
                Module: hr-foreign
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body Container with Sidebar and Content */}
      <div className="flex flex-1 relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content View Container */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === "EMPLOYEES" && <EmployeeList />}
          {activeTab === "ACCOMMODATION" && <AccommodationManagement />}
          {activeTab === "DAILY_PRESENCE" && <DailyPresenceReport />}
          {activeTab === "EXPIRING_DOCS" && <ExpiringDocsAlert />}
          {activeTab === "VEHICLE_MANAGEMENT" && <VehicleManagement />}
          {activeTab === "MEAL_MANAGEMENT" && <MealManagement />}
          {activeTab === "HR_DOMESTIC_PLACEHOLDER" && <JanitorialHrManagement />}
          {activeTab === "EXPORT_HUB" && <ReportHub />}
        </main>
      </div>
    </div>
  );
};

export default App;

