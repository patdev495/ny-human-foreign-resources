import React, { useState, useEffect } from "react";
import {
  type NavTab,
  type NavItem,
  hrForeignItems,
  janitorItems,
  exportSubItems,
  exportItem,
} from "./sidebar/sidebarItems";
import { MobileSidebarDrawer } from "./sidebar/MobileSidebarDrawer";

export type { NavTab, NavItem };
export { hrForeignItems, janitorItems, exportSubItems, exportItem };

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const isHrForeignActive = hrForeignItems.some((item) => item.key === activeTab);
  const isJanitorActive =
    activeTab === "HR_DOMESTIC_PLACEHOLDER" ||
    activeTab === "JANITOR_PROFILES" ||
    activeTab === "JANITOR_ATTENDANCE";
  const isExportActive =
    activeTab === "EXPORT_LEGAL" ||
    activeTab === "EXPORT_PRESENCE" ||
    activeTab === "EXPORT_MEAL" ||
    activeTab === "EXPORT_JANITOR";

  const [isHrForeignOpen, setIsHrForeignOpen] = useState(isHrForeignActive);
  const [isJanitorOpen, setIsJanitorOpen] = useState(isJanitorActive);
  const [isExportOpen, setIsExportOpen] = useState(isExportActive);

  useEffect(() => {
    if (isHrForeignActive) {
      setIsHrForeignOpen(true);
      setIsJanitorOpen(false);
      setIsExportOpen(false);
    } else if (isJanitorActive) {
      setIsJanitorOpen(true);
      setIsHrForeignOpen(false);
      setIsExportOpen(false);
    } else if (isExportActive) {
      setIsExportOpen(true);
      setIsHrForeignOpen(false);
      setIsJanitorOpen(false);
    }
  }, [activeTab]);

  const handleToggleHrForeign = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setIsHrForeignOpen(true);
      setIsJanitorOpen(false);
      setIsExportOpen(false);
    } else {
      const next = !isHrForeignOpen;
      setIsHrForeignOpen(next);
      if (next) {
        setIsJanitorOpen(false);
        setIsExportOpen(false);
      }
    }
  };

  const handleToggleJanitor = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setIsJanitorOpen(true);
      setIsHrForeignOpen(false);
      setIsExportOpen(false);
    } else {
      const next = !isJanitorOpen;
      setIsJanitorOpen(next);
      if (next) {
        setIsHrForeignOpen(false);
        setIsExportOpen(false);
      }
    }
  };

  const handleToggleExport = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setIsExportOpen(true);
      setIsHrForeignOpen(false);
      setIsJanitorOpen(false);
    } else {
      const next = !isExportOpen;
      setIsExportOpen(next);
      if (next) {
        setIsHrForeignOpen(false);
        setIsJanitorOpen(false);
      }
    }
  };

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

          {/* HR Foreign Accordion */}
          <div className="space-y-1">
            <button
              onClick={handleToggleHrForeign}
              title={!isSidebarOpen ? "Nhân sự nước ngoài" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isHrForeignActive
                  ? "text-blue-700 bg-blue-50/80 border border-blue-100"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className={isHrForeignActive ? "text-blue-600" : "text-slate-600"}>
                  🌐
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
                {hrForeignItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === item.key
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                  >
                    <span>{item.icon}</span>
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Janitor Accordion */}
          <div className="pt-2 space-y-1">
            <button
              onClick={handleToggleJanitor}
              title={!isSidebarOpen ? "Nhân sự Tạp vụ" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isJanitorActive
                  ? "text-amber-700 bg-amber-50/80 border border-amber-100"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-amber-500 text-lg">🧹</span>
                {isSidebarOpen && <span className="truncate">Nhân sự Tạp vụ</span>}
              </div>
              {isSidebarOpen && (
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isJanitorOpen ? "rotate-180" : ""
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

            {(isJanitorOpen || !isSidebarOpen) && (
              <div className={`space-y-1 ${isSidebarOpen ? "pl-3 border-l-2 border-amber-100 ml-4 my-1" : ""}`}>
                {janitorItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === item.key
                        ? "bg-amber-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                  >
                    <span>{item.icon}</span>
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveTab("VEHICLE_MANAGEMENT")}
              title={!isSidebarOpen ? "Quản lý xe" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "VEHICLE_MANAGEMENT"
                  ? "bg-blue-600 text-white font-bold shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <span className="text-blue-600 text-lg">🚐</span>
              {isSidebarOpen && <span className="truncate">Quản lý xe</span>}
            </button>

            <button
              onClick={() => setActiveTab("MEAL_MANAGEMENT")}
              title={!isSidebarOpen ? "Chi phí bữa ăn" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === "MEAL_MANAGEMENT"
                  ? "bg-amber-600 text-white font-bold shadow-xs"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <span className="text-amber-600 text-lg">🍱</span>
              {isSidebarOpen && <span className="truncate">Chi phí bữa ăn</span>}
            </button>
          </div>

          {/* EXPORT HUB ACCORDION SUB-MENU */}
          <div className="pt-2 border-t border-slate-200 space-y-1">
            <button
              onClick={handleToggleExport}
              title={!isSidebarOpen ? "Xuất Báo cáo Excel" : undefined}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                isExportActive
                  ? "text-emerald-700 bg-emerald-50/80 border border-emerald-200"
                  : "text-slate-700 hover:bg-slate-100"
              } ${!isSidebarOpen ? "justify-center" : ""}`}
            >
              <div className="flex items-center gap-3">
                <span className={isExportActive ? "text-emerald-600" : "text-slate-600"}>
                  {exportItem.icon}
                </span>
                {isSidebarOpen && <span className="truncate">{exportItem.label}</span>}
              </div>
              {isSidebarOpen && (
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                    isExportOpen ? "rotate-180" : ""
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

            {(isExportOpen || !isSidebarOpen) && (
              <div className={`space-y-1 ${isSidebarOpen ? "pl-3 border-l-2 border-emerald-100 ml-4 my-1" : ""}`}>
                {exportSubItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    title={!isSidebarOpen ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === item.key
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    } ${!isSidebarOpen ? "justify-center" : ""}`}
                  >
                    <span>{item.icon}</span>
                    {isSidebarOpen && <span className="truncate">{item.label}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <MobileSidebarDrawer
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </>
  );
};
