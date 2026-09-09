import React, { useEffect, useState } from "react";
import { EmployeeList } from "./features/hr-foreign/components/EmployeeList";
import { AccommodationManagement } from "./features/hr-foreign/components/AccommodationManagement";
import { ExpiringDocsAlert } from "./features/hr-foreign/components/ExpiringDocsAlert";
import { MealManagement } from "./features/hr-foreign/components/MealManagement";
import { VehicleManagement } from "./features/vehicle-management/components/VehicleManagement";
import { DailyPresenceReport } from "./features/hr-foreign/components/DailyPresenceReport";
import { ReportHub } from "./features/hr-foreign/components/ReportHub";
import { JanitorialHrManagement } from "./features/hr-foreign/components/JanitorialHrManagement";
import { JanitorDailyAttendance } from "./features/hr-foreign/components/JanitorDailyAttendance";
import { Sidebar } from "./components/Sidebar";
import type { NavTab } from "./components/Sidebar";

export const App: React.FC = () => {
  const readTabFromHash = (): NavTab => {
    const candidate = window.location.hash.slice(1) as NavTab;
    const knownTabs: NavTab[] = ["EMPLOYEES", "ACCOMMODATION", "DAILY_PRESENCE", "EXPIRING_DOCS", "VEHICLE_MANAGEMENT", "VEHICLE_DISPATCH", "VEHICLE_STATS", "VEHICLE_CONTRACTS", "MEAL_MANAGEMENT", "HR_DOMESTIC_PLACEHOLDER", "JANITOR_PROFILES", "JANITOR_ATTENDANCE", "EXPORT_LEGAL", "EXPORT_PRESENCE", "EXPORT_MEAL", "EXPORT_JANITOR", "EXPORT_VEHICLES", "EXPORT_TRIP_DURATION"];
    return knownTabs.includes(candidate) ? candidate : "EMPLOYEES";
  };
  const [activeTab, setActiveTab] = useState<NavTab>(readTabFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const syncTabFromUrl = (): void => setActiveTab(readTabFromHash());
    window.addEventListener("hashchange", syncTabFromUrl);
    return () => window.removeEventListener("hashchange", syncTabFromUrl);
  }, []);

  const navigateToTab = (tab: NavTab): void => {
    if (tab === activeTab) return;
    window.location.hash = tab;
    setActiveTab(tab);
  };

  return (
    <div className="workspace-shell flex flex-col">
      {/* Top Header Navbar */}
      <header className="workspace-header sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsSidebarOpen(!isSidebarOpen);
                  setIsMobileOpen(!isMobileOpen);
                }}
                title={isSidebarOpen ? "Thu gọn Sidebar" : "Mở rộng Sidebar"}
                aria-label={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
                className="inline-flex min-w-11 min-h-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer border border-slate-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                  NY
                </div>
                <div className="hidden sm:block">
                  <span className="block text-lg font-bold tracking-tight text-slate-900">NY Workspace</span>
                  <span className="block text-xs text-slate-500 font-medium">Nhân sự & vận hành</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden md:inline-flex text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Không gian vận hành
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Body Container with Sidebar and Content */}
      <div className="flex flex-1 relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content View Container */}
        <main id="main-content" className="workspace-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {activeTab === "EMPLOYEES" && <EmployeeList />}
          {activeTab === "ACCOMMODATION" && <AccommodationManagement />}
          {activeTab === "DAILY_PRESENCE" && <DailyPresenceReport />}
          {activeTab === "EXPIRING_DOCS" && <ExpiringDocsAlert />}
          {(activeTab === "VEHICLE_MANAGEMENT" ||
            activeTab === "VEHICLE_DISPATCH" ||
            activeTab === "VEHICLE_STATS" ||
            activeTab === "VEHICLE_CONTRACTS") && (
            <VehicleManagement activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
          {activeTab === "MEAL_MANAGEMENT" && <MealManagement />}
          {(activeTab === "HR_DOMESTIC_PLACEHOLDER" || activeTab === "JANITOR_PROFILES") && (
            <JanitorialHrManagement />
          )}
          {activeTab === "JANITOR_ATTENDANCE" && <JanitorDailyAttendance />}
          {(activeTab === "EXPORT_LEGAL" ||
            activeTab === "EXPORT_PRESENCE" ||
            activeTab === "EXPORT_MEAL" ||
            activeTab === "EXPORT_JANITOR" ||
            activeTab === "EXPORT_VEHICLES" ||
            activeTab === "EXPORT_TRIP_DURATION") && (
              <ReportHub activeTab={activeTab} />
            )}


        </main>
      </div>
    </div>
  );
};

export default App;

