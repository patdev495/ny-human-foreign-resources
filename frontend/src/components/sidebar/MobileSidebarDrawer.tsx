import React, { useEffect, useRef } from "react";
import {
  type NavTab,
  hrForeignItems,
  janitorItems,
  vehicleItems,
  exportSubItems,
  exportItem,
} from "./sidebarItems";

interface MobileSidebarDrawerProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  isMobileOpen,
  setIsMobileOpen,
  activeTab,
  setActiveTab,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isMobileOpen) return undefined;
    lastFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      lastFocusedElement.current?.focus();
    };
  }, [isMobileOpen, setIsMobileOpen]);

  if (!isMobileOpen) return null;

  const handleSelect = (tab: NavTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <div className="workspace-mobile-drawer sm:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Điều hướng chính">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        onClick={() => setIsMobileOpen(false)}
      />
      <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white p-4 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-bold text-slate-800 text-sm">Danh mục Quản lý</span>
          <button
            ref={closeButtonRef}
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng điều hướng"
            className="min-w-11 min-h-11 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1">
          {hrForeignItems.map((item) => (
            <button
              key={item.key}
              onClick={() => handleSelect(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === item.key
                  ? "bg-blue-600 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}

          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Nhân sự Tạp vụ</span>
            </div>
            {janitorItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  activeTab === item.key
                    ? "bg-amber-600 text-white"
                    : "text-amber-800 hover:bg-amber-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>Quản lý xe</span>
            </div>
            {vehicleItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  activeTab === item.key
                    ? "bg-blue-600 text-white"
                    : "text-blue-800 hover:bg-blue-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => handleSelect("MEAL_MANAGEMENT")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
              activeTab === "MEAL_MANAGEMENT"
                ? "bg-amber-600 text-white"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>Chi phí bữa ăn</span>
          </button>

          <div className="pt-2 border-t border-slate-200 space-y-1">
            <div className="px-3 py-1 text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>{exportItem.label}</span>
            </div>
            {exportSubItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold ${
                  activeTab === item.key
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-800 hover:bg-emerald-50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
