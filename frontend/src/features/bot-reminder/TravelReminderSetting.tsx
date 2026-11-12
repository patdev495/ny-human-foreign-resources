import { useEffect, useState, type FormEvent } from "react";
import { botReminderApi, type TravelReminderConfig } from "./api";

export function TravelReminderSetting() {
  const [config, setConfig] = useState<TravelReminderConfig>({ enabled: true, days_before: 3, time: "08:00" });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setReady(false); setError("");
    void botReminderApi.travel().then(result => {
      if (active) { setConfig(result); setReady(true); }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Không tải được cấu hình.");
    });
    return () => { active = false; };
  }, [attempt]);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      setConfig(await botReminderApi.saveTravel(config));
      setMessage("Đã lưu cấu hình nhắc lịch xuất nhập cảnh cho cả Zalo và Telegram.");
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Không lưu được cấu hình.");
    } finally { setBusy(false); }
  }

  return <section className="mb-5 rounded-xl border border-slate-200 p-4">
    <h3 className="font-semibold text-slate-900">Nhắc lịch xuất nhập cảnh dự kiến</h3>
    <p className="mt-1 text-sm text-slate-600">Gửi tổng hợp mỗi ngày một lần qua các kênh Zalo/Telegram đang bật cho HR đã chọn. Nhắc từ mốc báo trước đến hết ngày dự kiến; dừng khi đã cập nhật ngày thực tế. Cài đặt này dùng chung cho cả hai kênh.</p>
    <form onSubmit={event => void save(event)} className="mt-3">
      <fieldset disabled={!ready || busy} className="flex flex-wrap items-end gap-3 disabled:opacity-50">
        <label className="flex items-center gap-2 py-2 text-sm"><input type="checkbox" checked={config.enabled}
          onChange={event => setConfig({ ...config, enabled: event.target.checked })} />Bật nhắc lịch</label>
        <label className="text-sm">Báo trước (ngày)<input type="number" min={0} max={365} step={1} required
          value={config.days_before} onChange={event => setConfig({ ...config, days_before: event.target.valueAsNumber })}
          className="mt-1 block w-32 rounded-lg border border-slate-300 px-3 py-2" /></label>
        <label className="text-sm">Giờ gửi (Việt Nam)<input type="time" required value={config.time}
          onChange={event => setConfig({ ...config, time: event.target.value })}
          className="mt-1 block rounded-lg border border-slate-300 px-3 py-2" /></label>
        <button type="submit" className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white">{busy ? "Đang lưu…" : "Lưu nhắc lịch"}</button>
      </fieldset>
    </form>
    {message && <p role="status" className="mt-2 text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
    {!ready && error && <button type="button" onClick={() => setAttempt(value => value + 1)} className="mt-2 text-sm text-indigo-700 underline">Tải lại cấu hình</button>}
  </section>;
}
