import React, { useState } from "react";

export type NavTab =
  | "EMPLOYEES"
  | "ACCOMMODATION"
  | "DAILY_PRESENCE"
  | "EXPIRING_DOCS"
  | "MEAL_MANAGEMENT"
  | "SHUTTLE_DISPATCH"
  | "HR_DOMESTIC_PLACEHOLDER"
  | "EXPORT_HUB";

export interface NavItem {
  key: NavTab;
  label: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const hrForeignItems: NavItem[] = [
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

export const exportItem: NavItem = {
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

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const [isHrForeignOpen, setIsHrForeignOpen] = useState(true);
  const isHrForeignActive = hrForeignItems.some((item) => item.key === activeTab);

  return (
    <>
      <aside
        className={`hidden sm:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 z-30 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="p-3 space-y-2 sticky top-16">
          <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {isSidebarOpen ? "Danh mục Quản lý" : "Menu"}
          </div>

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

            {(isHrForeignOpen || !isSidebarOpen) && (
              <div className={`space-y-1 ${isSidebarOpen ? "pl-3 border-l-2 border-slate-100 ml-4 my-1" : ""}`}>
                {hrForeignItems.map((item) => {
                  const isActive = activeTab === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      title={!isSidebarOpen ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      } ${!isSidebarOpen ? "justify-center" : ""}`}
                    >
                      <span>{item.icon}</span>
                      {isSidebarOpen && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab("HR_DOMESTIC_PLACEHOLDER")}
              title={!isSidebarOpen ? "Nhân sự Tạp vụ" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "HR_DOMESTIC_PLACEHOLDER"
                  ? "bg-amber-500 text-white font-bold shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <span className="text-amber-500 text-lg">🧹</span>
              {isSidebarOpen && <span className="truncate">Nhân sự Tạp vụ</span>}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => setActiveTab(exportItem.key)}
              title={!isSidebarOpen ? exportItem.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === exportItem.key
                  ? "bg-emerald-600 text-white font-bold shadow-xs"
                  : "text-emerald-700 hover:bg-emerald-50"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <span>{exportItem.icon}</span>
              {isSidebarOpen && <span className="truncate">{exportItem.label}</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="font-bold text-slate-800 text-sm">Danh mục Quản lý</span>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1">
              {hrForeignItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                    activeTab === item.key ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setActiveTab("HR_DOMESTIC_PLACEHOLDER");
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === "HR_DOMESTIC_PLACEHOLDER" ? "bg-amber-500 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                🧹 <span>Nhân sự Tạp vụ</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab(exportItem.key);
                  setIsMobileOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === exportItem.key ? "bg-emerald-600 text-white" : "text-emerald-700 hover:bg-emerald-50"
                }`}
              >
                {exportItem.icon}
                <span>{exportItem.label}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
