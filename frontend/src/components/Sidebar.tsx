import React, { useEffect, useState } from "react";
import {
  Users,
  Sparkles,
  Car,
  FileSpreadsheet,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import {
  type NavItem,
  type NavTab,
  exportItem,
  exportSubItems,
  hrForeignItems,
  janitorItems,
  vehicleItems,
} from "./sidebar/sidebarItems";
import { MobileSidebarDrawer } from "./sidebar/MobileSidebarDrawer";

export type { NavItem, NavTab };

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavigationGroup {
  id: "foreign" | "janitor" | "vehicle" | "export";
  label: string;
  icon: LucideIcon;
  color: string;
  items: NavItem[];
}

const groups: NavigationGroup[] = [
  {
    id: "foreign",
    label: "Nhân sự nước ngoài",
    icon: Users,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    items: hrForeignItems,
  },
  {
    id: "janitor",
    label: "Nhân sự tạp vụ",
    icon: Sparkles,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    items: janitorItems,
  },
  {
    id: "vehicle",
    label: "Quản lý xe & điều xe",
    icon: Car,
    color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    items: vehicleItems,
  },
  {
    id: "export",
    label: exportItem.label,
    icon: FileSpreadsheet,
    color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    items: exportSubItems,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isSidebarOpen,
  setIsSidebarOpen,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const activeGroup = groups.find((group) =>
    group.items.some((item) => item.key === activeTab)
  );
  const [openGroup, setOpenGroup] = useState<NavigationGroup["id"] | null>(
    activeGroup?.id ?? "foreign"
  );

  useEffect(() => {
    if (activeGroup) {
      setOpenGroup(activeGroup.id);
    }
  }, [activeGroup]);

  const toggleGroup = (group: NavigationGroup): void => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setOpenGroup(group.id);
      return;
    }
    setOpenGroup((current) => (current === group.id ? null : group.id));
  };

  return (
    <>
      <aside
        className={`hidden sm:flex flex-col border-r border-slate-800/80 bg-[#090d16] text-slate-400 transition-all duration-300 ease-in-out z-30 shrink-0 select-none ${
          isSidebarOpen ? "w-68" : "w-20"
        }`}
        aria-label="Điều hướng chính"
      >
        <div className="sticky top-16 flex h-[calc(100dvh-4rem)] flex-col justify-between overflow-y-auto px-3 py-5">
          <div className="space-y-4">
            {isSidebarOpen && (
              <div className="px-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Phân hệ quản trị
                </span>
              </div>
            )}

            <nav className="space-y-1.5" aria-label="Danh sách phân hệ">
              {groups.map((group) => {
                const isOpen = openGroup === group.id;
                const isGroupActive = activeGroup?.id === group.id;
                const IconComponent = group.icon;

                return (
                  <div key={group.id} className="space-y-1">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group)}
                      title={!isSidebarOpen ? group.label : undefined}
                      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 cursor-pointer ${
                        isGroupActive
                          ? "bg-white/10 text-white shadow-xs"
                          : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                      } ${!isSidebarOpen ? "justify-center px-2" : ""}`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${group.color}`}
                      >
                        <IconComponent className="h-4 w-4" />
                      </div>

                      {isSidebarOpen && (
                        <>
                          <span className="min-w-0 flex-1 truncate text-left text-[13px]">
                            {group.label}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-white" : ""
                            }`}
                          />
                        </>
                      )}
                    </button>

                    {/* Sub-Items */}
                    {isSidebarOpen && isOpen && (
                      <div className="ml-5 space-y-0.5 border-l border-slate-800 pl-3 pt-1 pb-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        {group.items.map((item) => {
                          const isItemActive = activeTab === item.key;
                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setActiveTab(item.key)}
                              className={`group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all duration-150 cursor-pointer ${
                                isItemActive
                                  ? "bg-indigo-600/20 text-indigo-200 font-semibold border-l-2 border-indigo-400 pl-2 shadow-inner"
                                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                              }`}
                            >
                              <span
                                className={`transition-colors ${
                                  isItemActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"
                                }`}
                              >
                                {item.icon}
                              </span>
                              <span className="truncate text-left">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer info */}
          {isSidebarOpen && (
            <div className="mt-auto border-t border-slate-800/80 pt-4 px-2">
              <div className="rounded-xl bg-slate-900/60 p-3 border border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-300">Hệ thống sẵn sàng</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">NY Industrial Operations v2.0</p>
              </div>
            </div>
          )}
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
