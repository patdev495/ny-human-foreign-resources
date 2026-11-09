import type { EmailDeliveryLogRead } from "../types";
import { systemField, systemSecondaryButton } from "../../../shared/components/systemStyles";

interface EmailConfigTabSectionProps {
  recipientEmails: string;
  setRecipientEmails: (value: string) => void;
  scheduledTime: string;
  setScheduledTime: (value: string) => void;
  isEnabled: boolean;
  setIsEnabled: (value: boolean) => void;
  testEmailAddr: string;
  setTestEmailAddr: (value: string) => void;
  sendingTest: boolean;
  onSendTestMail: () => void;
  triggeringNow: boolean;
  onTriggerNow: () => void;
  emailLogs: EmailDeliveryLogRead[];
}

export function EmailConfigTabSection({ recipientEmails, setRecipientEmails, scheduledTime, setScheduledTime, isEnabled, setIsEnabled, testEmailAddr, setTestEmailAddr, sendingTest, onSendTestMail, triggeringNow, onTriggerNow, emailLogs }: EmailConfigTabSectionProps) {
  return <div className="space-y-5">
    <div>
      <label htmlFor="warning-recipients" className="mb-1.5 block text-sm text-slate-700">Email nhận cảnh báo</label>
      <textarea id="warning-recipients" rows={3} value={recipientEmails} onChange={(event) => setRecipientEmails(event.target.value)} aria-describedby="warning-recipients-help"
        placeholder="hr@company.com, admin-hr@company.com" className={systemField} />
      <p id="warning-recipients-help" className="mt-1.5 text-xs text-slate-600">Nhập các địa chỉ nhận bản tin, phân cách bằng dấu phẩy.</p>
    </div>
    <div className="flex flex-wrap items-end justify-between gap-3 border-y border-slate-200 py-3">
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isEnabled} onChange={(event) => setIsEnabled(event.target.checked)} className="h-4 w-4 accent-slate-800" /> Tự động gửi hàng ngày</label>
      <div><label htmlFor="warning-email-time" className="mb-1.5 block text-sm text-slate-600">Giờ gửi (Việt Nam)</label>
        <input id="warning-email-time" type="time" required value={scheduledTime} onChange={(event) => setScheduledTime(event.target.value)} className={`${systemField} w-auto`} /></div>
    </div>
    <section className="space-y-3" aria-label="Gửi email cảnh báo">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 basis-52"><label htmlFor="warning-test-email" className="mb-1.5 block text-sm text-slate-700">Email nhận thử</label>
          <input id="warning-test-email" type="email" value={testEmailAddr} onChange={(event) => setTestEmailAddr(event.target.value)} placeholder="Địa chỉ nhận thư thử nghiệm" className={systemField} /></div>
        <button type="button" onClick={onSendTestMail} disabled={sendingTest} className={systemSecondaryButton}>{sendingTest ? "Đang gửi…" : "Gửi thư kiểm tra"}</button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-slate-200 p-3">
        <p className="min-w-0 flex-1 basis-64 text-sm text-slate-600">Gửi bản tin theo cấu hình đã lưu. Lưu các thay đổi trước khi gửi.</p>
        <button type="button" onClick={onTriggerNow} disabled={triggeringNow} className={systemSecondaryButton}>{triggeringNow ? "Đang gửi…" : "Gửi cảnh báo ngay"}</button>
      </div>
    </section>
    <section className="space-y-2" aria-label="Nhật ký gửi email">
      <h3 className="text-sm font-semibold text-slate-900">Nhật ký gửi gần nhất</h3>
      {emailLogs.length === 0 ? <p className="text-sm text-slate-600">Chưa có nhật ký gửi email.</p> : <ul className="divide-y divide-slate-200 rounded-sm border border-slate-200">
        {emailLogs.slice(0, 3).map((log) => <li key={log.id} className="space-y-1 px-3 py-3 text-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="text-slate-700">{new Date(log.sent_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {log.trigger_type}</span>
            <span className={log.status === "SUCCESS" ? "text-slate-700" : "text-red-700"}>{log.status === "SUCCESS" ? "Thành công" : "Lỗi"}</span></div>
          <p className="break-words text-xs text-slate-600">{log.recipients || "Không có người nhận"}</p>
          <p className="text-xs text-slate-600">{log.total_expired_docs} quá hạn · {log.total_expiring_docs} sắp hết hạn</p>
          {log.error_message && <p className="break-words text-xs text-red-700">{log.error_message}</p>}
        </li>)}
      </ul>}
    </section>
  </div>;
}
