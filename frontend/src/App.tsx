import React, { useEffect, useState } from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  ChevronRight,
} from "lucide-react";
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

const tabMetaMap: Record<NavTab, { section: string; title: string }> = {
  EMPLOYEES: { section: "Nhân sự nước ngoài", title: "Hồ sơ nhân sự" },
  ACCOMMODATION: { section: "Nhân sự nước ngoài", title: "Chỗ ở & Lưu trú" },
  DAILY_PRESENCE: { section: "Nhân sự nước ngoài", title: "Thống kê Hiện diện" },
  EXPIRING_DOCS: { section: "Nhân sự nước ngoài", title: "Cảnh báo Giấy tờ" },
  MEAL_MANAGEMENT: { section: "Nhân sự nước ngoài", title: "Chi phí Bữa ăn" },
  JANITOR_PROFILES: { section: "Nhân sự tạp vụ", title: "Hồ sơ Tạp vụ" },
  HR_DOMESTIC_PLACEHOLDER: { section: "Nhân sự tạp vụ", title: "Hồ sơ Tạp vụ" },
  JANITOR_ATTENDANCE: { section: "Nhân sự tạp vụ", title: "Điểm danh hàng ngày" },
  VEHICLE_MANAGEMENT: { section: "Quản lý xe", title: "Điều hành xe" },
  VEHICLE_DISPATCH: { section: "Quản lý xe", title: "Nhật ký Điều xe" },
  VEHICLE_STATS: { section: "Quản lý xe", title: "Thống kê Quãng đường" },
  VEHICLE_CONTRACTS: { section: "Quản lý xe", title: "Hợp đồng & Bảng giá" },
  EXPORT_LEGAL: { section: "Báo cáo Excel", title: "Hồ sơ người nước ngoài" },
  EXPORT_PRESENCE: { section: "Báo cáo Excel", title: "Hiện diện KTX / Khách sạn" },
  EXPORT_MEAL: { section: "Báo cáo Excel", title: "Chi phí Bữa ăn" },
  EXPORT_JANITOR: { section: "Báo cáo Excel", title: "Chấm công & Lương Tạp vụ" },
  EXPORT_VEHICLES: { section: "Báo cáo Excel", title: "Chi phí Thuê xe" },
  EXPORT_TRIP_DURATION: { section: "Báo cáo Excel", title: "Đợt Lưu trú & Xuất nhập cảnh" },
};

export const App: React.FC = () => {
  const readTabFromHash = (): NavTab => {
    const candidate = window.location.hash.slice(1) as NavTab;
    const knownTabs: NavTab[] = [
      "EMPLOYEES",
      "ACCOMMODATION",
      "DAILY_PRESENCE",
      "EXPIRING_DOCS",
      "VEHICLE_MANAGEMENT",
      "VEHICLE_DISPATCH",
      "VEHICLE_STATS",
      "VEHICLE_CONTRACTS",
      "MEAL_MANAGEMENT",
      "HR_DOMESTIC_PLACEHOLDER",
      "JANITOR_PROFILES",
      "JANITOR_ATTENDANCE",
      "EXPORT_LEGAL",
      "EXPORT_PRESENCE",
      "EXPORT_MEAL",
      "EXPORT_JANITOR",
      "EXPORT_VEHICLES",
      "EXPORT_TRIP_DURATION",
    ];
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

  const currentMeta = tabMetaMap[activeTab] || {
    section: "Không gian làm việc",
    title: "Hồ sơ nhân sự",
  };

  const todayFormatted = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date());

  return (
    <div className="workspace-shell flex min-h-screen flex-col">
      {/* Sleek Glassmorphism Header */}
      <header className="workspace-header sticky top-0 z-40">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Sidebar Toggle & Brand / Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(!isSidebarOpen);
                setIsMobileOpen(!isMobileOpen);
              }}
              title={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
              aria-label={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/80 sm:flex"
            >
              <span className="hidden sm:inline-block">
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </span>
              <span className="sm:hidden inline-block">
                <Menu className="h-4 w-4" />
              </span>
            </button>

            {/* Brand Identity */}
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white font-black text-sm shadow-sm shadow-indigo-500/20">
                NY
              </div>
              <div className="hidden md:block">
                <span className="block text-sm font-bold tracking-tight text-slate-900 leading-tight">
                  NY Workspace
                </span>
                <span className="block text-[10px] font-medium text-slate-500">
                  Nhân sự & Vận hành
                </span>
              </div>
            </div>

            {/* Dynamic Breadcrumbs */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-slate-200 text-xs">
              <span className="font-medium text-slate-500">{currentMeta.section}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentMeta.title}
              </span>
            </div>
          </div>

          {/* Right: Date & Status indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/70 border border-slate-200/60 text-xs text-slate-600 font-medium capitalize">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              <span>{todayFormatted}</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sẵn sàng</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body Container with Sidebar and Content */}
      <div className="flex flex-1 relative min-w-0">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={navigateToTab}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content View Container */}
        <main
          id="main-content"
          className="workspace-main flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto"
        >
          <div className="mx-auto max-w-7xl">
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
              activeTab === "EXPORT_TRIP_DURATION") && <ReportHub activeTab={activeTab} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
