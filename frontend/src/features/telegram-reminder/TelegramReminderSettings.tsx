import { useEffect, useState } from "react";
import { telegramReminderApi as api } from "./api";
import { botReminderApi } from "../bot-reminder/api";
import type { TelegramBotState, TelegramDailyDelivery, TelegramDelivery, TelegramRecipient } from "./types";

interface Props { onClose: () => void; onZalo: () => void }

export function TelegramReminderSettings({ onClose, onZalo }: Props) {
  const [bot, setBot] = useState<TelegramBotState | null>(null);
  const [token, setToken] = useState("");
  const [cutoff, setCutoff] = useState("17:00");
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState("");
  const [pendingDesired, setPendingDesired] = useState<boolean | null>(null);
  const [people, setPeople] = useState<TelegramRecipient[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [testId, setTestId] = useState("");
  const [history, setHistory] = useState<TelegramDelivery[]>([]);
  const [daily, setDaily] = useState<TelegramDailyDelivery[]>([]);
  const [date, setDate] = useState(() => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function reload(): Promise<void> {
    const [connection, channel, recipients, deliveries, sharedCutoff] = await Promise.all([
      api.bot(), api.enabled(), api.recipients(), api.deliveries(), botReminderApi.cutoff(),
    ]);
    setCutoff(sharedCutoff.time);
    setBot(connection); setEnabled(channel.enabled); setPeople(recipients);
    setPendingDesired(channel.pending_enabled);
    setPending(channel.pending_enabled === null ? "" : `Từ ngày mai sẽ ${channel.pending_enabled ? "bật" : "tắt"} gửi tự động Telegram.`);
    const ids = recipients.filter((person) => person.selected).map((person) => person.id);
    setSelected(ids); setSaved(ids); setHistory(deliveries);
  }

  useEffect(() => { void reload().catch((cause: unknown) => setError(String(cause))); }, []);
  useEffect(() => { void api.daily(date).then(setDaily).catch((cause: unknown) => setError(String(cause))); }, [date]);

  async function perform(action: () => Promise<void>): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try { await action(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Thao tác thất bại."); }
    finally { setBusy(false); }
  }

  const filtered = people.filter((person) =>
    `${person.name} ${person.username} ${person.id}`.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div role="dialog" aria-modal="true" aria-label="Thông báo (bot) Telegram"
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900">Thông báo (bot)</h2>
          <div className="mt-2 flex gap-2 text-sm"><button type="button" onClick={onZalo} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">Zalo</button>
            <span className="rounded-lg bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">Telegram</span></div></div>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">Đóng</button>
      </div>
      {error && <p role="alert" className="mb-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {message && <p role="status" className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <section className="mb-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">Mốc chốt Báo cơm và thông báo (dùng chung)</h3>
        <p className="mt-1 text-sm text-slate-600">Giờ Việt Nam. Mốc này cũng là hạn Báo cơm và thời điểm HR bắt đầu chốt bữa.</p>
        <div className="mt-3 flex gap-2"><input type="time" aria-label="Mốc chốt Báo cơm" value={cutoff}
          onChange={(event) => setCutoff(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" disabled={busy} onClick={() => void perform(async () => {
            const result = await botReminderApi.saveCutoff(cutoff); setCutoff(result.time);
            setMessage(`Đã lưu mốc chốt ${result.time} giờ Việt Nam cho cả hai kênh.`);
          })} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Lưu mốc giờ</button></div>
      </section>
      <section className="mb-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">Kết nối bot Telegram</h3>
        <p className="mt-1 text-sm text-slate-600">{bot?.connected ? `${bot.name} (@${bot.username})` : "Chưa liên kết bot"}</p>
        {bot?.connected && <a href={bot.url} target="_blank" rel="noreferrer" className="text-sm text-indigo-700 underline">{bot.url}</a>}
        {bot?.connected && <button type="button" onClick={() => void navigator.clipboard.writeText(bot.url)} className="ml-3 text-sm text-indigo-700 underline">Sao chép đường dẫn</button>}
        {bot?.id && <button type="button" disabled={busy} onClick={() => void perform(async () => {
          const result = await api.checkBot(); setBot(result);
          setMessage(result.connected ? "Bot Telegram đang hoạt động." : "Không xác thực được bot. Hãy kiểm tra hoặc nhập token mới.");
        })} className="ml-3 text-sm text-indigo-700 underline disabled:opacity-50">Kiểm tra bot</button>}
        <div className="mt-3 flex flex-wrap gap-2"><input type="password" autoComplete="off" aria-label="Token bot Telegram mới" value={token}
          onChange={(event) => setToken(event.target.value)} placeholder="Nhập token bot" className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" disabled={busy || !token} onClick={() => void perform(async () => {
            await api.connect(token); setToken(""); await reload(); setMessage("Đã xác thực và liên kết bot Telegram.");
          })} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Xác thực và lưu</button></div>
        <p className="mt-2 text-xs text-slate-500">Khi thay sang bot khác, người nhận cần Start bot mới và admin chọn lại.</p>
      </section>
      <section className="mb-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">Gửi tự động qua Telegram</h3>
        <p className="mt-1 text-sm text-slate-600">Trạng thái hiệu lực hôm nay: {enabled ? "Bật" : "Tắt"}. Gửi thử vẫn dùng được khi tắt.</p>
        {pending && <p className="mt-1 text-sm text-amber-700">{pending}</p>}
        <button type="button" disabled={busy || !bot?.connected} onClick={() => void perform(async () => {
          const result = await api.saveEnabled(!(pendingDesired ?? enabled));
          const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
          if (result.effective_date === today) setEnabled(result.enabled);
          setPendingDesired(result.effective_date === today || result.enabled === enabled ? null : result.enabled);
          setPending(result.effective_date === today || result.enabled === enabled ? "" : `Thay đổi có hiệu lực từ ${result.effective_date}.`);
        })} className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {(pendingDesired ?? enabled) ? "Tắt gửi tự động Telegram" : "Bật gửi tự động Telegram"}</button>
      </section>
      <section className="mb-4 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between"><h3 className="font-semibold">Danh sách HR nhận thông báo</h3>
          <button type="button" disabled={busy || !bot?.connected} onClick={() => void perform(async () => {
            const rows = await api.saveRecipients(selected); setPeople(rows);
            setSaved(rows.filter((person) => person.selected).map((person) => person.id)); setMessage("Đã lưu người nhận Telegram.");
          })} className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Lưu danh sách</button></div>
        <input aria-label="Tìm người đã Start bot" value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên, username hoặc ID" className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">{filtered.map((person) => <label key={person.id} className="flex gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
          <input type="checkbox" checked={selected.includes(person.id)} onChange={() => setSelected((current) =>
            current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id])} />
          <span className="text-sm">{person.name} · @{person.username || "—"} · ID {person.id}</span></label>)}
          {filtered.length === 0 && <p className="text-sm text-slate-500">Chưa có người Start bot hoặc không tìm thấy.</p>}</div>
      </section>
      <section className="mb-4 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold">Gửi thử cho một HR đã chọn</h3>
        <div className="mt-2 flex gap-2"><select aria-label="Chọn HR Telegram để gửi thử" value={testId} onChange={(event) => setTestId(event.target.value)}
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="">Chọn người nhận</option>
          {people.filter((person) => saved.includes(person.id)).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}</select>
          <button type="button" disabled={busy || !testId} onClick={() => void perform(async () => {
            try { await api.sendTest(testId); setMessage("Đã gửi thử Telegram."); }
            finally { setHistory(await api.deliveries()); }
          })} className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Gửi thử ngay</button></div>
      </section>
      <section className="mb-4 rounded-xl border border-slate-200 p-4"><h3 className="font-semibold">Lịch sử gửi thử Telegram</h3>
        <div className="mt-2 space-y-1 text-sm">{history.map((row, index) => <p key={`${row.id}-${index}`} className="rounded-lg bg-slate-50 px-3 py-2">
          {row.name} · {row.status} · {new Date(row.created_at).toLocaleString("vi-VN")} {row.error}</p>)}
          {history.length === 0 && <p className="text-slate-500">Chưa có lượt gửi thử.</p>}</div></section>
      <section className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Lịch gửi tự động theo ngày</h3><input type="date" aria-label="Ngày gửi Telegram" value={date}
          onChange={(event) => setDate(event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" /></div>
        <button type="button" disabled={busy} onClick={() => void perform(async () => {
          const result = await api.runDue(); setDate(result.date); setDaily(await api.daily(result.date));
          setMessage(result.due ? "Đã kiểm tra lượt đến hạn." : "Chưa đến mốc chốt.");
        })} className="mt-2 rounded-lg bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50">Kiểm tra lượt đến hạn</button>
        <div className="mt-2 space-y-1 text-sm">{daily.map((row) => <p key={`${row.date}-${row.bot_id}-${row.id}`} className="rounded-lg bg-slate-50 px-3 py-2">
          {row.name} · {row.status} · {row.error}</p>)}{daily.length === 0 && <p className="text-slate-500">Chưa có lượt gửi trong ngày này.</p>}</div>
      </section>
    </div>
  </div>;
}
