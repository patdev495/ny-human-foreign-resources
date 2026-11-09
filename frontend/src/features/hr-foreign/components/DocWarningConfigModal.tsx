import { useState, useEffect, useCallback, useRef, type FormEvent } from "react";
import type { DocWarningConfigUpdateItem, EmailDeliveryLogRead } from "../types";
import { fetchDocWarningConfigs, updateDocWarningConfigs, fetchEmailConfig, updateEmailConfig, sendTestEmail, triggerWarningEmailNow, fetchEmailDeliveryLogs } from "../api";
import { EmailConfigTabSection } from "./EmailConfigTabSection";
import { defaultWarningConfigs, warningDocuments, type DocumentType, type WarningConfigValues } from "./document-warnings/warningUtils";
import { SystemDialog } from "../../../shared/components/SystemDialog";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemField, systemPrimaryButton, systemSecondaryButton } from "../../../shared/components/systemStyles";

interface DocWarningConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DocWarningConfigModal({ isOpen, onClose, onSaved }: DocWarningConfigModalProps) {
  const [activeTab, setActiveTab] = useState<"THRESHOLD" | "EMAIL">("THRESHOLD");
  const [configs, setConfigs] = useState<WarningConfigValues>(defaultWarningConfigs);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const [testEmailAddr, setTestEmailAddr] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [triggeringNow, setTriggeringNow] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailDeliveryLogRead[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const requestSequence = useRef(0);

  const loadData = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setReady(false);
    setLoadError(null);
    setError(null);
    setSuccessMsg(null);
    try {
      const [thresholds, emailConfig, logs] = await Promise.all([fetchDocWarningConfigs(), fetchEmailConfig(), fetchEmailDeliveryLogs()]);
      if (sequence !== requestSequence.current) return;
      const values = defaultWarningConfigs();
      thresholds.configs.forEach((item) => { values[item.doc_type] = { warning_value: item.warning_value, warning_unit: item.warning_unit }; });
      setConfigs(values);
      setRecipientEmails(emailConfig.recipient_emails || "");
      setIsEnabled(emailConfig.is_enabled);
      setScheduledTime(emailConfig.scheduled_time || "08:00");
      setTestEmailAddr(emailConfig.recipient_emails?.split(",")[0]?.trim() || "");
      setEmailLogs(logs);
      setReady(true);
    } catch (cause: unknown) {
      if (sequence === requestSequence.current) {
        console.error("Failed to load document warning settings:", cause);
        setLoadError("Không thể tải cấu hình cảnh báo và email. Vui lòng thử lại.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (isOpen) void loadData();
    return () => { requestSequence.current += 1; };
  }, [isOpen, loadData]);

  const handleChangeValue = (type: DocumentType, value: number): void => {
    setConfigs((previous) => ({ ...previous, [type]: { ...previous[type], warning_value: Math.max(1, value) } }));
  };
  const handleChangeUnit = (type: DocumentType, unit: "DAY" | "MONTH"): void => {
    setConfigs((previous) => ({ ...previous, [type]: { ...previous[type], warning_unit: unit } }));
  };
  const handleSendTestMail = async (): Promise<void> => {
    if (!ready || sendingTest || saving || triggeringNow) return;
    if (!testEmailAddr.trim()) { setError("Vui lòng nhập địa chỉ email nhận thử."); return; }
    setSendingTest(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await sendTestEmail(testEmailAddr.trim());
      if (result.success) setSuccessMsg(result.message);
      else setError(result.message);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Gửi thư thử nghiệm thất bại."); }
    finally { setSendingTest(false); }
  };
  const handleTriggerNow = async (): Promise<void> => {
    if (!ready || triggeringNow || saving || sendingTest) return;
    setTriggeringNow(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const result = await triggerWarningEmailNow();
      if (result.success) {
        setSuccessMsg(`Đã phát hành email cảnh báo: ${result.total_expired_docs} quá hạn, ${result.total_expiring_docs} sắp hết hạn.`);
        setEmailLogs(await fetchEmailDeliveryLogs());
      } else setError(result.message);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Gửi thư cảnh báo thất bại."); }
    finally { setTriggeringNow(false); }
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!ready || saving || sendingTest || triggeringNow) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const payload: DocWarningConfigUpdateItem[] = warningDocuments.map((document) => ({ doc_type: document.type, ...configs[document.type] }));
      await Promise.all([updateDocWarningConfigs(payload), updateEmailConfig({ recipient_emails: recipientEmails.trim(), is_enabled: isEnabled, scheduled_time: scheduledTime })]);
      onSaved();
      onClose();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : "Không thể lưu cấu hình cảnh báo."); }
    finally { setSaving(false); }
  };
  const busy = saving || sendingTest || triggeringNow;

  return <SystemDialog isOpen={isOpen} onClose={onClose} title="Cấu hình cảnh báo giấy tờ" wide>
    <div className="space-y-4">
      <SystemTabs label="Cấu hình cảnh báo" active={activeTab} onChange={setActiveTab} items={[
        { key: "THRESHOLD", label: "Mốc cảnh báo" }, { key: "EMAIL", label: "Email thông báo" },
      ]} />
      {loadError && <div role="alert" className="text-sm text-red-800">{loadError}<button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} mt-2`}>Thử lại</button></div>}
      {error && <p role="alert" className="rounded-sm border border-red-200 p-3 text-sm text-red-800">{error}</p>}
      {successMsg && <p role="status" className="rounded-sm border border-slate-200 p-3 text-sm text-slate-700">{successMsg}</p>}
      {loading ? <p role="status" className="py-6 text-center text-sm text-slate-600">Đang tải cấu hình…</p> : ready && <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset disabled={busy} className="min-w-0 space-y-4 disabled:opacity-60">
          {activeTab === "THRESHOLD" ? <div>
            <p className="mb-3 text-sm text-slate-600">Đặt mốc riêng cho từng loại giấy tờ. Hệ thống dùng các mốc này để hiển thị và gửi cảnh báo.</p>
            <div className="divide-y divide-slate-200 rounded-sm border border-slate-200">
              {warningDocuments.map((document) => <div key={document.type} className="grid grid-cols-[minmax(0,1fr)_80px_96px] items-center gap-2 px-3 py-3">
                <label htmlFor={`warning-value-${document.type}`} className="text-sm text-slate-700">{document.label}</label>
                <input id={`warning-value-${document.type}`} type="number" required min={1} max={999} step={1} value={configs[document.type].warning_value}
                  onChange={(event) => handleChangeValue(document.type, Number.parseInt(event.target.value, 10) || 1)} className={`${systemField} px-2`} />
                <select value={configs[document.type].warning_unit} aria-label={`Đơn vị cảnh báo ${document.label}`}
                  onChange={(event) => handleChangeUnit(document.type, event.target.value as "DAY" | "MONTH")} className={`${systemField} px-2`}>
                  <option value="DAY">Ngày</option><option value="MONTH">Tháng</option>
                </select>
              </div>)}
            </div>
          </div> : <EmailConfigTabSection recipientEmails={recipientEmails} setRecipientEmails={setRecipientEmails} scheduledTime={scheduledTime} setScheduledTime={setScheduledTime}
            isEnabled={isEnabled} setIsEnabled={setIsEnabled} testEmailAddr={testEmailAddr} setTestEmailAddr={setTestEmailAddr} sendingTest={sendingTest} onSendTestMail={() => void handleSendTestMail()}
            triggeringNow={triggeringNow} onTriggerNow={() => void handleTriggerNow()} emailLogs={emailLogs} />}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
            {activeTab === "THRESHOLD" && <button type="button" onClick={() => setConfigs(defaultWarningConfigs())} className={systemSecondaryButton}>Đặt lại 30 ngày</button>}
            <div className="ml-auto flex gap-2"><button type="button" onClick={onClose} className={systemSecondaryButton}>Hủy</button>
              <button type="submit" disabled={busy} className={systemPrimaryButton}>{saving ? "Đang lưu…" : "Lưu cấu hình"}</button></div>
          </div>
        </fieldset>
      </form>}
    </div>
  </SystemDialog>;
}
