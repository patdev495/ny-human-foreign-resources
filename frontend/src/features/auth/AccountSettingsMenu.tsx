import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, KeyRound, LogOut, Settings, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ChangePassword } from "./ChangePassword";
import { UserManagement } from "./UserManagement";
import type { AuthUser } from "./types";

interface Props {
  user: AuthUser;
  onLogout: () => Promise<void>;
}

interface SettingAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
}

export function AccountSettingsMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const select = (action: () => void): void => {
    setOpen(false);
    action();
  };

  const accountActions: SettingAction[] = [
    ...(user.is_admin ? [{ label: "Quản lý tài khoản", icon: Users, onSelect: () => setShowUsers(true) }] : []),
    { label: "Đổi mật khẩu", icon: KeyRound, onSelect: () => setShowChangePassword(true) },
    { label: "Đăng xuất", icon: LogOut, onSelect: () => void onLogout() },
  ];

  return <>
    <div ref={menuRef} className="relative shrink-0">
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="account-settings-panel"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
        <Settings className="h-4 w-4" />
        <span>Cài đặt</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id="account-settings-panel"
        className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">Tài khoản & bảo mật</p>
        {accountActions.map(({ label, icon: Icon, onSelect }) => <button key={label} type="button"
          onClick={() => select(onSelect)}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
          <Icon className="h-4 w-4 text-slate-500" />{label}
        </button>)}
      </div>}
    </div>
    {showUsers && createPortal(
      <UserManagement currentUser={user} onClose={() => setShowUsers(false)} />, document.body,
    )}
    {showChangePassword && createPortal(
      <ChangePassword onClose={() => setShowChangePassword(false)}
        onChanged={() => { setShowChangePassword(false); void onLogout(); }} />, document.body,
    )}
  </>;
}
