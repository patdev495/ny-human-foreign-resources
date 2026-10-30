import { useEffect, useState, type FormEvent } from "react";
import App from "../../App";
import type { AuthUser } from "./types";
import { authError } from "./types";

export function AuthShell() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch("/api/auth/me")
      .then((response) => response.ok ? response.json() as Promise<AuthUser> : null)
      .then((currentUser) => { if (mounted) setUser(currentUser); })
      .catch(() => { if (mounted) setError("Không kết nối được máy chủ."); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!user) return;
    const checkSession = (): void => {
      void fetch("/api/auth/me").then((response) => {
        if (response.status === 401) setUser(null);
      }).catch(() => undefined);
    };
    const timer = window.setInterval(checkSession, 60_000);
    window.addEventListener("focus", checkSession);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", checkSession); };
  }, [user]);

  const login = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error(await authError(response));
      setUser(await response.json() as AuthUser);
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = async (): Promise<void> => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-slate-600">Đang kiểm tra đăng nhập…</div>;
  if (user) return <App user={user} onLogout={logout} />;

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
    <form onSubmit={login} className="w-full max-w-sm space-y-5 rounded-2xl bg-white p-8 shadow-xl">
      <div>
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-700 font-bold text-white">NY</div>
        <h1 className="text-2xl font-bold text-slate-900">Đăng nhập NY Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">Cổng quản lý nhân sự và vận hành</p>
      </div>
      <label className="block text-sm font-medium text-slate-700">Tên tài khoản
        <input autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      <label className="block text-sm font-medium text-slate-700">Mật khẩu
        <input type="password" autoComplete="current-password" required value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
      </label>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <button type="submit" disabled={submitting}
        className="w-full rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white hover:bg-indigo-800 disabled:opacity-50">
        {submitting ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  </main>;
}
