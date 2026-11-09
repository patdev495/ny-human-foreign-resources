import React, { useEffect, useState } from "react";
import {
  Menu,
  PanelLeftClose,
  PanelLeft,
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
import type { AuthUser } from "./features/auth/types";
import { AccountSettingsMenu } from "./features/auth/AccountSettingsMenu";

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
  VEHICLE_END_SHIFT: { section: "Quản lý xe", title: "Điều xe tan làm" },
  VEHICLE_STATS: { section: "Quản lý xe", title: "Thống kê Quãng đường" },
  VEHICLE_CONTRACTS: { section: "Quản lý xe", title: "Hợp đồng & Bảng giá" },
  EXPORT_LEGAL: { section: "Báo cáo Excel", title: "Hồ sơ người nước ngoài" },
  EXPORT_PRESENCE: { section: "Báo cáo Excel", title: "Hiện diện KTX / Khách sạn" },
  EXPORT_MEAL: { section: "Báo cáo Excel", title: "Chi phí Bữa ăn" },
  EXPORT_JANITOR: { section: "Báo cáo Excel", title: "Chấm công & Lương Tạp vụ" },
  EXPORT_VEHICLES: { section: "Báo cáo Excel", title: "Chi phí Thuê xe" },
  EXPORT_TRIP_DURATION: { section: "Báo cáo Excel", title: "Đợt Lưu trú & Xuất nhập cảnh" },
};

interface AppProps { user: AuthUser; onLogout: () => Promise<void> }

export const App: React.FC<AppProps> = ({ user, onLogout }) => {
  const readTabFromHash = (): NavTab => {
    const candidate = window.location.hash.slice(1) as NavTab;
    const knownTabs: NavTab[] = [
      "EMPLOYEES",
      "ACCOMMODATION",
      "DAILY_PRESENCE",
      "EXPIRING_DOCS",
      "VEHICLE_MANAGEMENT",
      "VEHICLE_DISPATCH",
      "VEHICLE_END_SHIFT",
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

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 text-slate-900" style={{ fontFamily: 'Arial, "Segoe UI", sans-serif' }}>
      <a href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById("main-content")?.focus(); }}
        className="sr-only fixed left-4 top-2 z-50 rounded-sm bg-white px-4 py-2 text-sm focus:not-sr-only">Đến nội dung chính</a>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-14 w-full items-center justify-between gap-3 px-4">
          {/* Left: Sidebar Toggle & Brand / Breadcrumbs */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              aria-expanded={isSidebarOpen}
              aria-controls="desktop-navigation"
              title={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
              aria-label={isSidebarOpen ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
              className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100 sm:inline-flex"
            >
              <span className="hidden sm:inline-block">
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </span>
            </button>
            <button type="button" onClick={() => setIsMobileOpen(true)} aria-label="Mở điều hướng" aria-expanded={isMobileOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100 sm:hidden">
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            {/* Brand Identity */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800 text-sm font-bold text-white">
                NY
              </div>
              <div>
                <span className="block whitespace-nowrap text-sm font-semibold text-slate-900">
                  NY Workspace
                </span>
              </div>
            </div>

            {/* Dynamic Breadcrumbs */}
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 text-sm xl:flex">
              <span className="font-medium text-slate-500">{currentMeta.section}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-700">
                {currentMeta.title}
              </span>
            </div>
          </div>

          {/* Account actions */}
          <div className="flex items-center gap-3">
            <span className="hidden max-w-60 truncate text-sm text-slate-600 md:inline" title={user.display_name}>{user.display_name}</span>
            <AccountSettingsMenu user={user} onLogout={onLogout} />
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
          tabIndex={-1}
          className="min-w-0 flex-1 p-4 sm:p-6 lg:p-7"
        >
          <div className="mx-auto max-w-[1600px]">
            {activeTab === "EMPLOYEES" && <EmployeeList />}
            {activeTab === "ACCOMMODATION" && <AccommodationManagement />}
            {activeTab === "DAILY_PRESENCE" && <DailyPresenceReport />}
            {activeTab === "EXPIRING_DOCS" && <ExpiringDocsAlert />}
            {(activeTab === "VEHICLE_MANAGEMENT" ||
              activeTab === "VEHICLE_DISPATCH" ||
              activeTab === "VEHICLE_END_SHIFT" ||
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
