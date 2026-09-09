import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";
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
    lastFocusedElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
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
    <div
      className="fixed inset-0 z-50 flex sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Điều hướng chính"
    >
      {/* Frosted Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={() => setIsMobileOpen(false)}
      />

      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white p-5 space-y-4 overflow-y-auto text-slate-800 border-r border-slate-200 shadow-2xl animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center font-extrabold text-sm shadow-md">
              NY
            </div>
            <span className="font-bold text-slate-900 text-sm">NY Workspace</span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng điều hướng"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Nhóm Nhân sự nước ngoài */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Nhân sự Nước ngoài
            </span>
            {hrForeignItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === item.key
                    ? "bg-indigo-50 text-indigo-700 font-bold border-l-2 border-indigo-600 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Nhóm Nhân sự Tạp vụ */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
              Nhân sự Tạp vụ
            </span>
            {janitorItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === item.key
                    ? "bg-emerald-50 text-emerald-700 font-bold border-l-2 border-emerald-600 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Nhóm Quản lý xe */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-cyan-600">
              Quản lý xe
            </span>
            {vehicleItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === item.key
                    ? "bg-cyan-50 text-cyan-700 font-bold border-l-2 border-cyan-600 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Nhóm Báo cáo Excel */}
          <div className="space-y-1 pt-2 border-t border-slate-200">
            <span className="px-2 text-[10px] font-bold uppercase tracking-wider text-rose-600">
              {exportItem.label}
            </span>
            {exportSubItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleSelect(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  activeTab === item.key
                    ? "bg-rose-50 text-rose-700 font-bold border-l-2 border-rose-600 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
