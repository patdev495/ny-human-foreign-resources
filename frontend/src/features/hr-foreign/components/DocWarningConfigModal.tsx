import React, { useState, useEffect } from "react";
import type { DocWarningConfigUpdateItem, EmailDeliveryLogRead } from "../types";
import {
  fetchDocWarningConfigs,
  updateDocWarningConfigs,
  fetchEmailConfig,
  updateEmailConfig,
  sendTestEmail,
  triggerWarningEmailNow,
  fetchEmailDeliveryLogs,
} from "../api";
import { EmailConfigTabSection } from "./EmailConfigTabSection";

interface DocWarningConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DOC_TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  VISA: { label: "Visa / Thị thực", icon: "🛂" },
  TAM_TRU: { label: "Đăng ký Tạm trú", icon: "🏠" },
  GPLD: { label: "Giấy phép lao động (GPLĐ)", icon: "💼" },
  CONTRACT: { label: "Hợp đồng lao động", icon: "📜" },
  PASSPORT: { label: "Hộ chiếu (Passport)", icon: "📘" },
};

const DOC_TYPE_ORDER = ["VISA", "TAM_TRU", "GPLD", "CONTRACT", "PASSPORT"];

export const DocWarningConfigModal: React.FC<DocWarningConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [activeTab, setActiveTab] = useState<"THRESHOLD" | "EMAIL">("THRESHOLD");
  const [configs, setConfigs] = useState<Record<string, { warning_value: number; warning_unit: "DAY" | "MONTH" }>>({
    VISA: { warning_value: 30, warning_unit: "DAY" },
    TAM_TRU: { warning_value: 30, warning_unit: "DAY" },
    GPLD: { warning_value: 30, warning_unit: "DAY" },
    CONTRACT: { warning_value: 30, warning_unit: "DAY" },
    PASSPORT: { warning_value: 30, warning_unit: "DAY" },
  });

  // Email Config State
  const [recipientEmails, setRecipientEmails] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [triggeringNow, setTriggeringNow] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailDeliveryLogRead[]>([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);

      const [resConfigs, resEmailCfg, resLogs] = await Promise.all([
        fetchDocWarningConfigs(),
        fetchEmailConfig(),
        fetchEmailDeliveryLogs(),
      ]);

      const map: Record<string, { warning_value: number; warning_unit: "DAY" | "MONTH" }> = {};
      resConfigs.configs.forEach((item) => {
        map[item.doc_type] = {
          warning_value: item.warning_value,
          warning_unit: item.warning_unit as "DAY" | "MONTH",
        };
      });
      setConfigs((prev) => ({ ...prev, ...map }));

      if (resEmailCfg) {
        setRecipientEmails(resEmailCfg.recipient_emails || "");
        setIsEnabled(resEmailCfg.is_enabled);
        setScheduledTime(resEmailCfg.scheduled_time || "08:00");
        const firstRecipient = resEmailCfg.recipient_emails?.split(",")[0]?.trim() || "";
        setTestEmailAddr(firstRecipient);
      }

      if (resLogs) {
        setEmailLogs(resLogs);
      }
    } catch (err: any) {
      console.error("Failed to load warning/email configs:", err);
      setError("Không thể tải cấu hình mốc và email cảnh báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChangeValue = (docType: string, val: number) => {
    setConfigs((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        warning_value: Math.max(1, val),
      },
    }));
  };

  const handleChangeUnit = (docType: string, unit: "DAY" | "MONTH") => {
    setConfigs((prev) => ({
      ...prev,
      [docType]: {
        ...prev[docType],
        warning_unit: unit,
      },
    }));
  };

  const handleResetDefaults = () => {
    setConfigs({
      VISA: { warning_value: 30, warning_unit: "DAY" },
      TAM_TRU: { warning_value: 30, warning_unit: "DAY" },
      GPLD: { warning_value: 30, warning_unit: "DAY" },
      CONTRACT: { warning_value: 30, warning_unit: "DAY" },
      PASSPORT: { warning_value: 30, warning_unit: "DAY" },
    });
  };

  const handleSendTestMail = async () => {
    if (!testEmailAddr.trim()) {
      setError("Vui lòng nhập địa chỉ email nhận test");
      return;
    }
    try {
      setSendingTest(true);
      setError(null);
      setSuccessMsg(null);
      const res = await sendTestEmail(testEmailAddr.trim());
      if (res.success) {
        setSuccessMsg(res.message);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Gửi thư thử nghiệm thất bại");
    } finally {
      setSendingTest(false);
    }
  };

  const handleTriggerNow = async () => {
    try {
      setTriggeringNow(true);
      setError(null);
      setSuccessMsg(null);
      const res = await triggerWarningEmailNow();
      if (res.success) {
        setSuccessMsg(`Đã phát hành email cảnh báo! (${res.total_expired_docs} quá hạn, ${res.total_expiring_docs} sắp hết hạn)`);
        const logs = await fetchEmailDeliveryLogs();
        setEmailLogs(logs);
      } else {
        setError(res.message);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Phát hành thư cảnh báo thất bại");
    } finally {
      setTriggeringNow(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const payloadConfigs: DocWarningConfigUpdateItem[] = DOC_TYPE_ORDER.map((docType) => ({
        doc_type: docType as any,
        warning_value: configs[docType]?.warning_value || 30,
        warning_unit: configs[docType]?.warning_unit || "DAY",
      }));

      await Promise.all([
        updateDocWarningConfigs(payloadConfigs),
        updateEmailConfig({
          recipient_emails: recipientEmails.trim(),
          is_enabled: isEnabled,
          scheduled_time: scheduledTime,
        }),
      ]);

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật cấu hình");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>⚙️</span> Cấu hình Cảnh báo Giấy tờ & Email Foxmail
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Thiết lập mốc hết hạn và địa chỉ email nhận bản tin cảnh báo tự động
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("THRESHOLD")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "THRESHOLD"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ⏱️ Mốc cảnh báo riêng (Ngày/Tháng)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("EMAIL")}
            className={`pb-2.5 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
              activeTab === "EMAIL"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            ✉️ Cấu hình Nhận Email (Foxmail)
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 font-medium">
              ⚠️ {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 font-medium">
              ✅ {successMsg}
            </div>
          )}

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Đang tải cấu hình...</div>
          ) : activeTab === "THRESHOLD" ? (
            <div className="space-y-3">
              {DOC_TYPE_ORDER.map((docType) => {
                const info = DOC_TYPE_LABELS[docType];
                const itemConfig = configs[docType] || { warning_value: 30, warning_unit: "DAY" };
                return (
                  <div
                    key={docType}
                    className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{info.icon}</span>
                      <span className="text-xs font-bold text-slate-800">{info.label}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={itemConfig.warning_value}
                        onChange={(e) => handleChangeValue(docType, parseInt(e.target.value) || 1)}
                        className="w-20 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center bg-white text-slate-900 focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={itemConfig.warning_unit}
                        onChange={(e) => handleChangeUnit(docType, e.target.value as "DAY" | "MONTH")}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="DAY">Ngày</option>
                        <option value="MONTH">Tháng</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmailConfigTabSection
              recipientEmails={recipientEmails}
              setRecipientEmails={setRecipientEmails}
              scheduledTime={scheduledTime}
              setScheduledTime={setScheduledTime}
              isEnabled={isEnabled}
              setIsEnabled={setIsEnabled}
              testEmailAddr={testEmailAddr}
              setTestEmailAddr={setTestEmailAddr}
              sendingTest={sendingTest}
              onSendTestMail={handleSendTestMail}
              triggeringNow={triggeringNow}
              onTriggerNow={handleTriggerNow}
              emailLogs={emailLogs}
            />
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {activeTab === "THRESHOLD" ? (
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Đặt lại mặc định (30 ngày)
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 text-xs font-medium cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs cursor-pointer disabled:opacity-60 transition-colors"
              >
                {saving ? "Đang lưu..." : "Lưu cấu hình"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
