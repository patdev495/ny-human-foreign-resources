import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "./types";
import { authError } from "./types";

interface Props { currentUser: AuthUser; onClose: () => void }

export function UserManagement({ currentUser, onClose }: Props) {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetTarget, setResetTarget] = useState<number | null>(null);
  const [resetValue, setResetValue] = useState("");

  const refresh = async (): Promise<void> => {
    const response = await fetch("/api/auth/users");
    if (!response.ok) throw new Error(await authError(response));
    setUsers(await response.json() as AuthUser[]);
  };

  useEffect(() => { void refresh().catch((cause: unknown) => setError(String(cause))); }, []);

  const create = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, display_name: displayName, password, is_admin: isAdmin }),
      });
      if (!response.ok) throw new Error(await authError(response));
      setUsername(""); setDisplayName(""); setPassword(""); setIsAdmin(false);
      setMessage("Đã tạo tài khoản.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không tạo được tài khoản."); }
    finally { setBusy(false); }
  };

  const update = async (target: AuthUser, changes: object): Promise<void> => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/auth/users/${target.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes),
      });
      if (!response.ok) throw new Error(await authError(response));
      setMessage("Đã cập nhật tài khoản.");
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không cập nhật được."); }
    finally { setBusy(false); }
  };

  const resetPassword = async (target: AuthUser): Promise<void> => {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/auth/users/${target.id}/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetValue }),
      });
      if (!response.ok) throw new Error(await authError(response));
      setMessage(`Đã đổi mật khẩu ${target.username}. Các phiên đăng nhập cũ đã hết hiệu lực.`);
      setResetTarget(null); setResetValue("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không đổi được mật khẩu."); }
    finally { setBusy(false); }
  };

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div role="dialog" aria-modal="true" aria-label="Quản lý tài khoản"
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Quản lý tài khoản</h2>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">Đóng</button>
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <form onSubmit={create} className="mb-6 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
        <h3 className="font-semibold sm:col-span-2">Tạo tài khoản</h3>
        <input aria-label="Tên tài khoản mới" placeholder="Tên tài khoản" required minLength={3} value={username}
          onChange={(event) => setUsername(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input aria-label="Tên hiển thị" placeholder="Tên hiển thị" required value={displayName}
          onChange={(event) => setDisplayName(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2" />
        <input aria-label="Mật khẩu ban đầu" placeholder="Mật khẩu ban đầu (từ 12 ký tự)" type="password" required minLength={12}
          value={password} onChange={(event) => setPassword(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isAdmin}
          onChange={(event) => setIsAdmin(event.target.checked)} /> Quyền quản trị tài khoản</label>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white disabled:opacity-50 sm:col-span-2">Tạo tài khoản</button>
      </form>
      <h3 className="mb-3 font-semibold">Tài khoản hiện có</h3>
      <div className="space-y-2">
        {users.map((target) => <div key={target.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
          <div className="min-w-40 flex-1"><div className="font-medium">{target.display_name}</div>
            <div className="text-xs text-slate-500">{target.username} · {target.is_admin ? "Admin" : "Người dùng"} · {target.is_active ? "Đang hoạt động" : "Đã khóa"}</div>
          </div>
          <button type="button" disabled={busy || target.id === currentUser.id} onClick={() => void update(target, { is_active: !target.is_active })}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{target.is_active ? "Khóa" : "Mở khóa"}</button>
          <button type="button" disabled={busy || target.id === currentUser.id} onClick={() => void update(target, { is_admin: !target.is_admin })}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">{target.is_admin ? "Bỏ admin" : "Cấp admin"}</button>
          <button type="button" disabled={busy || target.id === currentUser.id} onClick={() => { setResetTarget(target.id); setResetValue(""); }}
            className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Đặt lại mật khẩu</button>
          {resetTarget === target.id && <form onSubmit={(event) => { event.preventDefault(); void resetPassword(target); }}
            className="flex w-full gap-2 pt-2">
            <input aria-label={`Mật khẩu mới cho ${target.username}`} type="password" autoComplete="new-password"
              minLength={12} maxLength={256} required value={resetValue}
              onChange={(event) => setResetValue(event.target.value)} placeholder="Mật khẩu mới (từ 12 ký tự)"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2" />
            <button type="submit" disabled={busy} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm text-white disabled:opacity-50">Lưu</button>
            <button type="button" onClick={() => { setResetTarget(null); setResetValue(""); }} className="rounded-lg border px-3 py-2 text-sm">Hủy</button>
          </form>}
        </div>)}
      </div>
    </div>
  </div>;
}
