import React from "react";
import type { EmailDeliveryLogRead } from "../types";

interface EmailConfigTabSectionProps {
  recipientEmails: string;
  setRecipientEmails: (val: string) => void;
  scheduledTime: string;
  setScheduledTime: (val: string) => void;
  isEnabled: boolean;
  setIsEnabled: (val: boolean) => void;
  testEmailAddr: string;
  setTestEmailAddr: (val: string) => void;
  sendingTest: boolean;
  onSendTestMail: () => void;
  triggeringNow: boolean;
  onTriggerNow: () => void;
  emailLogs: EmailDeliveryLogRead[];
}

export const EmailConfigTabSection: React.FC<EmailConfigTabSectionProps> = ({
  recipientEmails,
  setRecipientEmails,
  scheduledTime,
  setScheduledTime,
  isEnabled,
  setIsEnabled,
  testEmailAddr,
  setTestEmailAddr,
  sendingTest,
  onSendTestMail,
  triggeringNow,
  onTriggerNow,
  emailLogs,
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* Recipient Emails */}
      <div>
        <label className="block font-bold text-slate-800 mb-1">
          Danh sách Email HR Nhận Cảnh Báo (Foxmail)
        </label>
        <textarea
          rows={2}
          value={recipientEmails}
          onChange={(e) => setRecipientEmails(e.target.value)}
          placeholder="Ví dụ: hr@company.com, admin-hr@company.com"
          className="w-full p-2.5 border border-slate-300 rounded-lg font-mono text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 text-xs"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          * Nhập 1 hoặc nhiều email phân cách bởi dấu phẩy. Mọi email đăng nhập trong ứng dụng Foxmail của HR sẽ tự động nhận bản tin gộp.
        </p>
      </div>

      {/* Automation settings */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
        <div>
          <span className="font-bold text-slate-800">Tự động phát hành hàng ngày</span>
          <p className="text-[11px] text-slate-500">Gửi 1 email tổng hợp lúc {scheduledTime} sáng</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="time"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="px-2 py-1 border border-slate-300 rounded text-xs bg-white font-mono"
          />
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {/* Action Buttons: Test Mail & Trigger Now */}
      <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <label className="block font-bold text-blue-900 mb-1">Kiểm tra kết nối SMTP gửi đi</label>
            <input
              type="email"
              value={testEmailAddr}
              onChange={(e) => setTestEmailAddr(e.target.value)}
              placeholder="Email nhận mail test..."
              className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg text-xs bg-white"
            />
          </div>
          <button
            type="button"
            onClick={onSendTestMail}
            disabled={sendingTest}
            className="self-end px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60 transition-colors"
          >
            {sendingTest ? "Đang gửi test..." : "📧 Gửi mail test"}
          </button>
        </div>

        <div className="pt-2 border-t border-blue-200/60 flex items-center justify-between">
          <span className="text-blue-900 font-medium">Phát hành bản tin cảnh báo thủ công:</span>
          <button
            type="button"
            onClick={onTriggerNow}
            disabled={triggeringNow}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs cursor-pointer disabled:opacity-60 transition-colors flex items-center gap-1.5"
          >
            <span>⚡</span>
            {triggeringNow ? "Đang gửi..." : "Gửi cảnh báo ngay"}
          </button>
        </div>
      </div>

      {/* Recent Logs */}
      {emailLogs.length > 0 && (
        <div className="pt-2">
          <label className="block font-bold text-slate-700 mb-1">Nhật ký phát hành gần nhất</label>
          <div className="max-h-24 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50 text-[11px]">
            {emailLogs.slice(0, 3).map((log) => (
              <div key={log.id} className="p-2 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800">
                    {new Date(log.sent_at).toLocaleString("vi-VN")} ({log.trigger_type})
                  </span>
                  <p className="text-slate-500 truncate max-w-xs">{log.recipients || "Không có người nhận"}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.status === "SUCCESS" ? "Thành công" : "Lỗi"}
                  </span>
                  <p className="text-slate-600">
                    🔴 {log.total_expired_docs} | 🟡 {log.total_expiring_docs}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
