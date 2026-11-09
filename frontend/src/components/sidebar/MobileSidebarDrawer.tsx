import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { type NavTab, navigationGroups } from "./sidebarItems";

interface MobileSidebarDrawerProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
}

export function MobileSidebarDrawer({ isMobileOpen, setIsMobileOpen, activeTab, setActiveTab }: MobileSidebarDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isMobileOpen || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnDesktop = (): void => {
      if (window.matchMedia("(min-width: 640px)").matches) setIsMobileOpen(false);
    };
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [isMobileOpen, setIsMobileOpen]);

  return <dialog ref={dialogRef} aria-label="Điều hướng chính" onCancel={() => setIsMobileOpen(false)}
    onClick={(event) => {
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX > bounds.right) setIsMobileOpen(false);
    }}
    className="fixed inset-y-0 left-0 m-0 h-dvh max-h-dvh w-72 max-w-[85vw] border-0 border-r border-slate-200 bg-white p-4 text-slate-900 backdrop:bg-slate-900/30">
    <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
      <span className="text-sm font-semibold">NY Workspace</span>
      <button type="button" onClick={() => setIsMobileOpen(false)} aria-label="Đóng điều hướng"
        className="flex h-10 w-10 items-center justify-center rounded-sm text-slate-600 hover:bg-slate-100">
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
    <nav className="space-y-5" aria-label="Các phân hệ">
      {navigationGroups.map((group) => <div key={group.id}>
        <p className="mb-1 px-2 text-sm font-semibold text-slate-700">{group.label}</p>
        {group.items.map((item) => <button key={item.key} type="button" onClick={() => { setActiveTab(item.key); setIsMobileOpen(false); }}
          aria-current={activeTab === item.key ? "page" : undefined}
          className={`flex min-h-11 w-full items-center border-l-2 px-4 py-2 text-left text-sm ${activeTab === item.key
            ? "border-slate-700 bg-slate-100 font-semibold text-slate-900"
            : "border-transparent text-slate-600 hover:bg-slate-50"}`}>
          {item.label}
        </button>)}
      </div>)}
    </nav>
  </dialog>;
}
