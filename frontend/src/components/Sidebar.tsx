import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { type NavTab, type NavigationGroup, navigationGroups } from "./sidebar/sidebarItems";
import { MobileSidebarDrawer } from "./sidebar/MobileSidebarDrawer";

export type { NavItem, NavTab } from "./sidebar/sidebarItems";

interface SidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const activeGroup = navigationGroups.find((group) => group.items.some((item) => item.key === activeTab));
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup?.id ?? "foreign");

  useEffect(() => {
    if (activeGroup) setOpenGroup(activeGroup.id);
  }, [activeGroup]);

  const toggleGroup = (group: NavigationGroup): void => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setOpenGroup(group.id);
      return;
    }
    setOpenGroup((current) => current === group.id ? null : group.id);
  };

  return <>
    <aside id="desktop-navigation" className={`hidden shrink-0 border-r border-slate-200 bg-white sm:block ${isSidebarOpen ? "w-56" : "w-16"}`}>
      <nav className="sticky top-14 max-h-[calc(100dvh-3.5rem)] space-y-2 overflow-y-auto px-2 py-5" aria-label="Điều hướng chính">
        {navigationGroups.map((group) => {
          const isOpen = openGroup === group.id;
          const Icon = group.icon;
          return <div key={group.id}>
            <button type="button" onClick={() => toggleGroup(group)} title={!isSidebarOpen ? group.label : undefined}
              aria-label={group.label} aria-expanded={isSidebarOpen && isOpen} aria-controls={`nav-${group.id}`}
              className={`flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100 ${!isSidebarOpen ? "justify-center" : ""}`}>
              <Icon className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
              {isSidebarOpen && <>
                <span className="flex-1">{group.label}</span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-slate-500 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </>}
            </button>
            <div id={`nav-${group.id}`} hidden={!isSidebarOpen || !isOpen} className="mt-1 space-y-0.5">
              {group.items.map((item) => <button key={item.key} type="button" onClick={() => setActiveTab(item.key)}
                aria-current={activeTab === item.key ? "page" : undefined}
                className={`flex min-h-10 w-full cursor-pointer items-center border-l-2 py-2 pr-2 pl-8 text-left text-sm ${activeTab === item.key
                  ? "border-slate-700 bg-slate-100 font-semibold text-slate-900"
                  : "border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
                {item.label}
              </button>)}
            </div>
          </div>;
        })}
      </nav>
    </aside>
    <MobileSidebarDrawer isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} activeTab={activeTab} setActiveTab={setActiveTab} />
  </>;
}
