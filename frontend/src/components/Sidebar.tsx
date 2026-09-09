import React, { useEffect, useState } from "react";
import { type NavItem, type NavTab, exportItem, exportSubItems, hrForeignItems, janitorItems, vehicleItems } from "./sidebar/sidebarItems";
import { MobileSidebarDrawer } from "./sidebar/MobileSidebarDrawer";

export type { NavItem, NavTab };
export { exportItem, exportSubItems, hrForeignItems, janitorItems, vehicleItems };

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
  shortLabel: string;
  items: NavItem[];
}

const groups: NavigationGroup[] = [
  { id: "foreign", label: "Nhân sự nước ngoài", shortLabel: "NN", items: hrForeignItems },
  { id: "janitor", label: "Nhân sự tạp vụ", shortLabel: "TV", items: janitorItems },
  { id: "vehicle", label: "Quản lý xe", shortLabel: "XE", items: vehicleItems },
  { id: "export", label: exportItem.label, shortLabel: "XL", items: exportSubItems },
];

const Chevron: React.FC<{ open: boolean }> = ({ open }) => (
  <svg aria-hidden="true" className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isMobileOpen, setIsMobileOpen }) => {
  const activeGroup = groups.find((group) => group.items.some((item) => item.key === activeTab));
  const [openGroup, setOpenGroup] = useState<NavigationGroup["id"] | null>(activeGroup?.id ?? null);

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup.id);
  }, [activeGroup]);

  const toggleGroup = (group: NavigationGroup): void => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setOpenGroup(group.id);
      return;
    }
    setOpenGroup((current) => (current === group.id ? null : group.id));
  };

  return <>
    <aside className={`workspace-sidebar hidden sm:flex flex-col border-r transition-[width] duration-200 z-30 ${isSidebarOpen ? "w-72" : "w-20"}`} aria-label="Điều hướng chính">
      <div className="workspace-nav-scroll sticky top-16 flex h-[calc(100dvh-4rem)] flex-col px-3 py-5">
        {isSidebarOpen && <p className="workspace-nav-kicker">Không gian làm việc</p>}
        <nav className="mt-3 space-y-2" aria-label="Các phân hệ">
          {groups.map((group) => {
            const isOpen = openGroup === group.id;
            const isActive = activeGroup?.id === group.id;
            return <section key={group.id} className="workspace-nav-group">
              <button type="button" onClick={() => toggleGroup(group)} aria-expanded={isSidebarOpen ? isOpen : undefined} title={!isSidebarOpen ? group.label : undefined} className={`workspace-nav-trigger ${isActive ? "workspace-nav-trigger-active" : ""} ${!isSidebarOpen ? "justify-center" : ""}`}>
                <span className="workspace-nav-mark" aria-hidden="true">{group.shortLabel}</span>
                {isSidebarOpen && <span className="min-w-0 flex-1 truncate text-left">{group.label}</span>}
                {isSidebarOpen && <Chevron open={isOpen} />}
              </button>
              {isSidebarOpen && isOpen && <div className="workspace-nav-children" role="group" aria-label={group.label}>
                {group.items.map((item) => <button type="button" key={item.key} onClick={() => setActiveTab(item.key)} className={`workspace-nav-item ${activeTab === item.key ? "workspace-nav-item-active" : ""}`}>
                  {item.icon}<span className="min-w-0 flex-1 truncate">{item.label}</span>
                </button>)}
              </div>}
            </section>;
          })}
          <div className="workspace-nav-divider" />
          <button type="button" onClick={() => setActiveTab("MEAL_MANAGEMENT")} title={!isSidebarOpen ? "Chi phí bữa ăn" : undefined} className={`workspace-nav-trigger ${activeTab === "MEAL_MANAGEMENT" ? "workspace-nav-trigger-active" : ""} ${!isSidebarOpen ? "justify-center" : ""}`}>
            <span className="workspace-nav-mark" aria-hidden="true">BA</span>
            {isSidebarOpen && <span className="min-w-0 flex-1 truncate text-left">Chi phí bữa ăn</span>}
          </button>
        </nav>
      </div>
    </aside>
    <MobileSidebarDrawer isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
  </>;
};
