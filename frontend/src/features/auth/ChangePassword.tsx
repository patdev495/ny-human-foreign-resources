import { useState, type FormEvent } from "react";
import { authError } from "./types";

interface Props { onClose: () => void; onChanged: () => void }

export function ChangePassword({ onClose, onChanged }: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!response.ok) throw new Error(await authError(response));
      onChanged();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không đổi được mật khẩu.");
    } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <form role="dialog" aria-modal="true" aria-label="Đổi mật khẩu" onSubmit={submit}
      className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-xl font-bold">Đổi mật khẩu</h2>
      <label className="block text-sm font-medium">Mật khẩu hiện tại
        <input type="password" autoComplete="current-password" required value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium">Mật khẩu mới (từ 12 ký tự)
        <input type="password" autoComplete="new-password" required minLength={12} maxLength={256}
          value={newPassword} onChange={(event) => setNewPassword(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2">Hủy</button>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-700 px-4 py-2 text-white disabled:opacity-50">Lưu</button>
      </div>
    </form>
  </div>;
}
