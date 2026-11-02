import { useEffect, useRef, useState } from "react";
import { zaloReminderApi } from "./api";
import { botReminderApi } from "../bot-reminder/api";
import type { ZaloBotStatus, ZaloDailyDelivery, ZaloDelivery, ZaloPerson } from "./types";

interface Props { onClose: () => void; onTelegram: () => void }

export function ZaloReminderSettings({ onClose, onTelegram }: Props) {
  const [status, setStatus] = useState<ZaloBotStatus | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [friends, setFriends] = useState<ZaloPerson[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<ZaloDelivery[]>([]);
  const [daily, setDaily] = useState<ZaloDailyDelivery[]>([]);
  const [cutoff, setCutoff] = useState("17:00");
  const [enabled, setEnabled] = useState(false);
  const [pendingState, setPendingState] = useState("");
  const [pendingDesired, setPendingDesired] = useState<boolean | null>(null);
  const [dailyDate, setDailyDate] = useState(() => new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [search, setSearch] = useState("");
  const [testId, setTestId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [message, setMessage] = useState("");
  const wasConnected = useRef(false);

  useEffect(() => () => { if (qrUrl) URL.revokeObjectURL(qrUrl); }, [qrUrl]);

  useEffect(() => {
    let live = true;
    const refresh = async (): Promise<void> => {
      try {
        const current = await zaloReminderApi.status();
        if (!live) return;
        setConnectionError("");
        setStatus(current);
        if (current.connected) {
          setQrUrl(null);
          if (!wasConnected.current) {
            const people = await zaloReminderApi.friends("");
            if (!live) return;
            setFriends(people);
            wasConnected.current = true;
          }
        } else {
          wasConnected.current = false;
          setFriends([]);
          const qr = current.qr_available ? await zaloReminderApi.qr() : null;
          if (live) setQrUrl(qr ? URL.createObjectURL(qr) : null);
        }
      } catch (cause) {
        if (live) {
          setStatus(null);
          setQrUrl(null);
          setConnectionError(cause instanceof Error ? cause.message : "Không kết nối được bot Zalo.");
        }
      }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 5000);
    void Promise.all([zaloReminderApi.recipients(), zaloReminderApi.deliveries(), botReminderApi.cutoff(), zaloReminderApi.enabled()])
      .then(([recipients, history, currentCutoff, channel]) => {
        if (!live) return;
        const ids = recipients.map((person) => person.id);
        setSelectedIds(ids); setSavedIds(ids); setDeliveries(history); setCutoff(currentCutoff.time); setEnabled(channel.enabled);
        setPendingDesired(channel.pending_enabled);
        if (channel.pending_enabled !== null) setPendingState(`Từ ngày mai sẽ ${channel.pending_enabled ? "bật" : "tắt"} gửi tự động Zalo.`);
      }).catch((cause: unknown) => { if (live) setError(String(cause)); });
    return () => { live = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    void zaloReminderApi.daily(dailyDate).then(setDaily).catch((cause: unknown) => setError(String(cause)));
  }, [dailyDate]);

  const filtered = friends.filter((person) => person.name.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const selectedPeople = selectedIds.map((id) => friends.find((person) => person.id === id))
    .filter((person): person is ZaloPerson => person !== undefined);

  function toggle(id: string): void {
    setSelectedIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function save(): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try {
      const recipients = await zaloReminderApi.saveRecipients(selectedIds);
      const ids = recipients.map((person) => person.id);
      setSelectedIds(ids); setSavedIds(ids);
      setMessage("Đã lưu danh sách HR nhận thông báo.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không lưu được danh sách."); }
    finally { setBusy(false); }
  }

  async function saveCutoff(): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await botReminderApi.saveCutoff(cutoff);
      setCutoff(result.time);
      setMessage(`Đã lưu mốc ${result.time} giờ Việt Nam cho hạn Báo cơm, chốt cơm và các kênh thông báo.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không lưu được mốc giờ."); }
    finally { setBusy(false); }
  }

  async function saveEnabled(value: boolean): Promise<void> {
    setBusy(true); setError("");
    try {
      const result = await zaloReminderApi.saveEnabled(value);
      const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
      if (result.effective_date === today) setEnabled(value);
      setPendingDesired(result.effective_date === today ? null : value === enabled ? null : value);
      setPendingState(result.effective_date === today || value === enabled ? "" : `Thay đổi có hiệu lực từ ${result.effective_date}. Lượt hôm nay vẫn theo trạng thái đã chốt.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không lưu được công tắc Zalo."); }
    finally { setBusy(false); }
  }

  async function checkDue(): Promise<void> {
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await zaloReminderApi.runDue();
      setDailyDate(result.date);
      setDaily(await zaloReminderApi.daily(result.date));
      setMessage(result.due ? "Đã kiểm tra các lượt gửi đến hạn." : "Chưa đến giờ gửi theo mốc đã cấu hình.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không kiểm tra được lịch gửi."); }
    finally { setBusy(false); }
  }

  async function sendTest(): Promise<void> {
    if (!testId) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await zaloReminderApi.sendTest(testId);
      setMessage("Đã gửi tin thử.");
      setDeliveries(await zaloReminderApi.deliveries());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Gửi thử thất bại.");
      setDeliveries(await zaloReminderApi.deliveries().catch(() => []));
    } finally { setBusy(false); }
  }

  return <div role="presentation" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
    <div role="dialog" aria-modal="true" aria-label="Cấu hình thông báo Zalo"
      className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><h2 className="text-xl font-bold text-slate-900">Thông báo (bot)</h2>
          <div className="mt-2 flex gap-2 text-sm"><span className="rounded-lg bg-indigo-100 px-3 py-1 font-semibold text-indigo-800">Zalo</span>
            <button type="button" onClick={onTelegram} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">Telegram</button></div></div>
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-slate-600 hover:bg-slate-100">Đóng</button>
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      {connectionError && <p role="alert" className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{connectionError}</p>}
      {message && <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <section className="mb-5 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Mốc chốt Báo cơm và thông báo (dùng chung)</h3>
        <p className="mt-1 text-sm text-slate-600">Giờ Việt Nam. Nhân viên hết hạn gửi Báo cơm, HR bắt đầu được chốt bữa Sáng/Tối và bot gửi lời nhắc cùng mốc này. Hạn Báo giờ tan làm giữ 17:00.</p>
        <div className="mt-3 flex gap-2"><input type="time" aria-label="Mốc chốt Báo cơm" value={cutoff} onChange={(event) => setCutoff(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button type="button" disabled={busy} onClick={() => void saveCutoff()}
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Lưu mốc giờ</button></div>
      </section>
      <section className="mb-5 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Gửi tự động qua Zalo</h3>
        <p className="mt-1 text-sm text-slate-600">Trạng thái hiệu lực hôm nay: {enabled ? "Bật" : "Tắt"}. Tắt vẫn cho phép gửi thử và giữ nguyên người nhận, lịch sử.</p>
        {pendingState && <p className="mt-1 text-sm text-amber-700">{pendingState}</p>}
        <button type="button" disabled={busy} onClick={() => void saveEnabled(!(pendingDesired ?? enabled))}
          className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {(pendingDesired ?? enabled) ? "Tắt gửi tự động Zalo" : "Bật gửi tự động Zalo"}</button>
      </section>
      <section className="mb-5 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Kết nối bot</h3>
        <p className={`mt-1 text-sm ${status?.connected ? "text-emerald-700" : "text-amber-700"}`}>
          {status?.connected ? "Đã kết nối" : status ? "Chưa kết nối — quét mã QR bằng tài khoản Zalo bot HR" : "Không lấy được trạng thái bot"}</p>
        {status && !status.connected && (qrUrl ? <img src={qrUrl} alt="Mã QR đăng nhập Zalo bot HR"
          className="mt-3 h-56 w-56 rounded-lg border border-slate-200 object-contain" />
          : <p className="mt-3 text-sm text-slate-500">Đang chờ bot tạo mã QR…</p>)}
      </section>
      <section className="mb-5 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Danh sách HR nhận thông báo</h3>
          <button type="button" onClick={() => void save()} disabled={busy || !status?.connected}
            className="rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Lưu danh sách</button></div>
        <input aria-label="Tìm bạn bè Zalo" value={search} onChange={(event) => setSearch(event.target.value)}
          placeholder="Tìm theo tên bạn bè Zalo" disabled={!status?.connected}
          className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <div className="mt-3 max-h-56 space-y-1 overflow-y-auto">
          {filtered.map((person) => <label key={person.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
            <input type="checkbox" checked={selectedIds.includes(person.id)} onChange={() => toggle(person.id)} />
            <span className="text-sm text-slate-800">{person.name}</span>
          </label>)}
          {status?.connected && filtered.length === 0 && <p className="text-sm text-slate-500">Không tìm thấy bạn bè phù hợp.</p>}
        </div>
      </section>
      <section className="mb-5 rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Gửi thử cho một HR</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <select aria-label="Chọn HR để gửi thử" value={testId} onChange={(event) => setTestId(event.target.value)}
            className="min-w-52 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Chọn người đã lưu</option>
            {selectedPeople.filter((person) => savedIds.includes(person.id)).map((person) =>
              <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
          <button type="button" onClick={() => void sendTest()} disabled={busy || !testId || !status?.connected}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Gửi thử ngay</button>
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900">Lịch sử gửi thử</h3>
        <div className="mt-3 space-y-2 text-sm">
          {deliveries.map((delivery, index) => <div key={`${delivery.id}-${index}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
            <span>{delivery.name}{delivery.created_at && <small className="ml-2 text-slate-500">{new Date(delivery.created_at).toLocaleString("vi-VN")}</small>}</span>
            <span className={delivery.status === "SENT" ? "text-emerald-700" : "text-rose-700"}>
              {delivery.status === "SENT" ? "Đã gửi" : `Thất bại: ${delivery.error}`}</span>
          </div>)}
          {deliveries.length === 0 && <p className="text-slate-500">Chưa có lượt gửi thử.</p>}
        </div>
      </section>
      <section className="mt-5 rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold text-slate-900">Lịch gửi tự động theo ngày</h3>
          <div className="flex gap-2"><input type="date" aria-label="Ngày gửi Zalo" value={dailyDate} onChange={(event) => setDailyDate(event.target.value)} className="rounded-lg border border-slate-300 px-2 py-1 text-sm" />
            <button type="button" disabled={busy} onClick={() => void checkDue()} className="rounded-lg bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-50">Kiểm tra lượt đến hạn</button></div></div>
        <p className="mt-2 text-xs text-slate-500">Tin chưa gửi được sẽ thử lại trong 30 phút. Kết quả chưa rõ cần kiểm tra trực tiếp trong Zalo để tránh gửi trùng.</p>
        <div className="mt-3 space-y-2 text-sm">{daily.map((item) => <div key={`${item.date}-${item.id}`} className="flex justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
          <span>{item.name} · {new Date(item.updated_at).toLocaleString("vi-VN")}</span><span>{item.status}{item.error ? ` · ${item.error}` : ""}</span>
        </div>)}{daily.length === 0 && <p className="text-slate-500">Chưa có lượt gửi trong ngày này.</p>}</div>
      </section>
    </div>
  </div>;
}
