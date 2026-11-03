import { useEffect, useState } from "react";
import { botReminderApi } from "./api";

export function PreReminderTimeSetting() {
  const [time, setTime] = useState("16:00");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void botReminderApi.preReminder().then(result => setTime(result.time)).catch((cause: unknown) => setError(String(cause)));
  }, []);

  async function save(): Promise<void> {
    setBusy(true); setMessage(""); setError("");
    try {
      const result = await botReminderApi.savePreReminder(time);
      setTime(result.time);
      setMessage(`Đã lưu giờ nhắc HR sớm: ${result.time} (giờ Việt Nam).`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được giờ nhắc HR.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="mb-5 rounded-xl border border-slate-200 p-4">
    <h3 className="font-semibold text-slate-900">Nhắc HR trước giờ chốt</h3>
    <p className="mt-1 text-sm text-slate-600">Gửi qua các kênh đang bật cho HR đã chọn. Tin nhắn cho biết số người chưa báo cơm ngày mai và chưa báo điều xe tan làm hôm nay. Giờ gửi phải trước giờ chốt cơm và 17:00.</p>
    <div className="mt-3 flex flex-wrap gap-2">
      <input type="time" aria-label="Giờ nhắc HR sớm" value={time} onChange={event => setTime(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      <button type="button" disabled={busy} onClick={() => void save()}
        className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Lưu giờ nhắc HR</button>
    </div>
    {message && <p role="status" className="mt-2 text-sm text-emerald-700">{message}</p>}
    {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
  </section>;
}
