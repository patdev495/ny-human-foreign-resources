import React, { useState } from "react";
import { EmployeeList } from "./features/hr-foreign/components/EmployeeList";
import { AccommodationManagement } from "./features/hr-foreign/components/AccommodationManagement";
import { ExpiringDocsAlert } from "./features/hr-foreign/components/ExpiringDocsAlert";
import { MealManagement } from "./features/hr-foreign/components/MealManagement";
import { ShuttleDispatch } from "./features/hr-foreign/components/ShuttleDispatch";
import { DailyPresenceReport } from "./features/hr-foreign/components/DailyPresenceReport";
import { ReportHub } from "./features/hr-foreign/components/ReportHub";

export type NavTab =
  | "EMPLOYEES"
  | "ACCOMMODATION"
  | "DAILY_PRESENCE"
  | "EXPIRING_DOCS"
  | "MEAL_MANAGEMENT"
  | "SHUTTLE_DISPATCH"
  | "EXPORT_HUB";

interface NavItem {
  key: NavTab;
  label: string;
  icon: React.ReactNode;
}

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>("EMPLOYEES");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isHrForeignOpen, setIsHrForeignOpen] = useState(true);

  // Sub-items for "Nhân sự nước ngoài"
  const hrForeignItems: NavItem[] = [
    {
      key: "EMPLOYEES",
      label: "Hồ sơ Nhân sự",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      key: "ACCOMMODATION",
      label: "Quản lý Chỗ ở & Lưu trú",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 21h18" />
          <path d="M9 8h1" />
          <path d="M9 12h1" />
          <path d="M9 16h1" />
          <path d="M14 8h1" />
          <path d="M14 12h1" />
          <path d="M14 16h1" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
        </svg>
      ),
    },
    {
      key: "DAILY_PRESENCE",
      label: "Thống kê Hiện diện",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
    {
      key: "EXPIRING_DOCS",
      label: "Cảnh báo Giấy tờ",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: "MEAL_MANAGEMENT",
      label: "Chi phí ăn uống",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      ),
    },
    {
      key: "SHUTTLE_DISPATCH",
      label: "Điều xe đưa đón",
      icon: (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="6" width="18" height="11" rx="2" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
          <path d="M17 6V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2" />
        </svg>
      ),
    },
  ];

  // Standalone top-level item: Xuất Báo cáo Excel
  const exportItem: NavItem = {
    key: "EXPORT_HUB",
    label: "Xuất Báo cáo Excel",
    icon: (
      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  };

  const isHrForeignActive = hrForeignItems.some((item) => item.key === activeTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      {/* Top Header Navbar */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Toggle Sidebar Button */}
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

              {/* Logo & Brand Title */}
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
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`hidden sm:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 ${
            isSidebarOpen ? "w-64" : "w-20"
          }`}
        >
          <div className="p-3 space-y-2 sticky top-16">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {isSidebarOpen ? "Danh mục Quản lý" : "Menu"}
            </div>

            {/* TOP-LEVEL 1: Nhân sự nước ngoài (Collapsible Parent Group) */}
            <div className="space-y-1">
              <button
                onClick={() => {
                  if (!isSidebarOpen) {
                    setIsSidebarOpen(true);
                    setIsHrForeignOpen(true);
                  } else {
                    setIsHrForeignOpen(!isHrForeignOpen);
                  }
                }}
                title={!isSidebarOpen ? "Nhân sự nước ngoài" : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                  isHrForeignActive
                    ? "text-blue-700 bg-blue-50/80 border border-blue-100"
                    : "text-slate-700 hover:bg-slate-100"
                } ${!isSidebarOpen ? "justify-center" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <span className={isHrForeignActive ? "text-blue-600" : "text-slate-600"}>
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  {isSidebarOpen && <span className="truncate">Nhân sự nước ngoài</span>}
                </div>
                {isSidebarOpen && (
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                      isHrForeignOpen ? "rotate-180" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>

              {/* Sub-items dropdown */}
              {(isHrForeignOpen || !isSidebarOpen) && (
                <div className={`space-y-1 ${isSidebarOpen ? "pl-3 border-l-2 border-slate-100 ml-4 my-1" : ""}`}>
                  {hrForeignItems.map((item) => {
                    const isActive = activeTab === item.key;
                    return (
                      <button
                        key={item.key}
                        onClick={() => setActiveTab(item.key)}
                        title={!isSidebarOpen ? item.label : undefined}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600 text-white shadow-xs font-bold"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        } ${!isSidebarOpen ? "justify-center" : ""}`}
                      >
                        <span className={isActive ? "text-white" : "text-slate-500"}>
                          {item.icon}
                        </span>
                        {isSidebarOpen && (
                          <span className="truncate flex-1 text-left">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* TOP-LEVEL 2: Xuất Báo cáo Excel (Standalone) */}
            <button
              onClick={() => setActiveTab("EXPORT_HUB")}
              title={!isSidebarOpen ? exportItem.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "EXPORT_HUB"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <span className={activeTab === "EXPORT_HUB" ? "text-white" : "text-emerald-600"}>
                {exportItem.icon}
              </span>
              {isSidebarOpen && (
                <span className="truncate flex-1 text-left">{exportItem.label}</span>
              )}
            </button>

            {/* TOP-LEVEL 3: Nhân sự tạp vụ (Placeholder / Standalone) */}
            <button
              disabled
              title={!isSidebarOpen ? "Nhân sự tạp vụ (Sắp có)" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-slate-400 bg-slate-50 border border-slate-100 cursor-not-allowed opacity-75 ${
                !isSidebarOpen ? "justify-center" : ""
              }`}
            >
              <span className="text-slate-400">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </span>
              {isSidebarOpen && (
                <div className="truncate flex-1 flex items-center justify-between text-left">
                  <span>Nhân sự tạp vụ</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Sắp có</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer / Overlay */}
        {isMobileOpen && (
          <div
            className="sm:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex"
            onClick={() => setIsMobileOpen(false)}
          >
            <aside
              className="w-72 bg-white h-full shadow-2xl p-4 space-y-3 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="font-bold text-slate-800 text-base">Danh mục Menu</div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {/* Mobile Group 1: Nhân sự nước ngoài */}
                <div>
                  <button
                    onClick={() => setIsHrForeignOpen(!isHrForeignOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl font-bold text-sm text-blue-700 bg-blue-50/80"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-blue-600">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                      <span>Nhân sự nước ngoài</span>
                    </div>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${isHrForeignOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {isHrForeignOpen && (
                    <div className="mt-1 pl-3 border-l-2 border-slate-100 ml-4 space-y-1">
                      {hrForeignItems.map((item) => {
                        const isActive = activeTab === item.key;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              setActiveTab(item.key);
                              setIsMobileOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                              isActive
                                ? "bg-blue-600 text-white shadow-xs font-bold"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span className={isActive ? "text-white" : "text-slate-500"}>{item.icon}</span>
                            <span className="truncate flex-1 text-left">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Mobile Group 2: Xuất Báo cáo Excel */}
                <button
                  onClick={() => {
                    setActiveTab("EXPORT_HUB");
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm transition-all ${
                    activeTab === "EXPORT_HUB"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className={activeTab === "EXPORT_HUB" ? "text-white" : "text-emerald-600"}>
                    {exportItem.icon}
                  </span>
                  <span className="truncate flex-1 text-left">{exportItem.label}</span>
                </button>

                {/* Mobile Group 3: Nhân sự tạp vụ */}
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-sm text-slate-400 bg-slate-50 cursor-not-allowed opacity-75 justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                      </svg>
                    </span>
                    <span>Nhân sự tạp vụ</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Sắp có</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6">
          {activeTab === "EMPLOYEES" && <EmployeeList />}

          {activeTab === "ACCOMMODATION" && <AccommodationManagement />}

          {activeTab === "DAILY_PRESENCE" && <DailyPresenceReport />}

          {activeTab === "EXPIRING_DOCS" && <ExpiringDocsAlert />}

          {activeTab === "EXPORT_HUB" && <ReportHub />}

          {activeTab === "MEAL_MANAGEMENT" && <MealManagement />}

          {activeTab === "SHUTTLE_DISPATCH" && <ShuttleDispatch />}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 z-10">
        NY Human Resources System &bull; Quản lý Nhân sự (hr-foreign) &bull; SQL Server 2008 R2 Compatible
      </footer>
    </div>
  );
};

export default App;
