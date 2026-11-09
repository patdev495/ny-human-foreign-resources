import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Settings } from "lucide-react";
import type { ExpiringDocumentItem, ProfileTab } from "../types";
import { getVisaLabel } from "../types";
import { fetchExpiringDocuments, fetchDocWarningConfigs } from "../api";
import { DocWarningConfigModal } from "./DocWarningConfigModal";
import { EmployeeProfileModal } from "./EmployeeProfileModal";
import { DocumentWarningsTable } from "./document-warnings/DocumentWarningsTable";
import { defaultWarningConfigs, documentWarningStatus, warningDocuments, warningThreshold, type DocumentType, type WarningConfigValues, type WarningFilter, type WarningStatus } from "./document-warnings/warningUtils";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemField, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";

export function ExpiringDocsAlert() {
  const [items, setItems] = useState<ExpiringDocumentItem[]>([]);
  const [configs, setConfigs] = useState<WarningConfigValues>(defaultWarningConfigs);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [documentType, setDocumentType] = useState<"ALL" | DocumentType>("ALL");
  const [statusFilter, setStatusFilter] = useState<WarningFilter>("ALL");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<ProfileTab | undefined>(undefined);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const requestSequence = useRef(0);

  const loadData = useCallback(async (): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError(null);
    try {
      const [documents, thresholds] = await Promise.all([fetchExpiringDocuments(), fetchDocWarningConfigs()]);
      if (sequence !== requestSequence.current) return;
      setItems(warningDocuments.flatMap((document) => (documents[document.responseKey] || []).map((item) => ({ ...item, doc_type: document.type }))));
      const values = defaultWarningConfigs();
      thresholds.configs.forEach((config) => { values[config.doc_type] = { warning_value: config.warning_value, warning_unit: config.warning_unit }; });
      setConfigs(values);
    } catch (cause: unknown) {
      if (sequence === requestSequence.current) {
        console.error("Failed to load document warnings:", cause);
        setError("Không thể tải cảnh báo giấy tờ. Kiểm tra kết nối rồi thử lại.");
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadData();
    return () => { requestSequence.current += 1; };
  }, [loadData]);

  const ready = !loading && !error;
  const typeItems = documentType === "ALL" ? items : items.filter((item) => item.doc_type === documentType);
  const counts: Record<WarningFilter, number> = { ALL: typeItems.length, EXPIRED: 0, EXPIRING: 0, MISSING: 0 };
  typeItems.forEach((item) => { counts[documentWarningStatus(item)] += 1; });
  const severity: Record<WarningStatus, number> = { EXPIRED: 0, MISSING: 1, EXPIRING: 2 };
  const filteredItems = typeItems.filter((item) => {
    if (statusFilter !== "ALL" && documentWarningStatus(item) !== statusFilter) return false;
    const keyword = query.trim().toLocaleLowerCase();
    const document = warningDocuments.find((entry) => entry.type === item.doc_type);
    return !keyword || [item.employee_name, item.passport_number, item.type_name, item.missing_reason, document?.label, item.doc_type === "VISA" ? getVisaLabel(item.type_name) : undefined]
      .some((value) => value?.toLocaleLowerCase().includes(keyword));
  }).sort((first, second) => severity[documentWarningStatus(first)] - severity[documentWarningStatus(second)]
    || (first.days_remaining ?? Number.MAX_SAFE_INTEGER) - (second.days_remaining ?? Number.MAX_SAFE_INTEGER)
    || first.employee_name.localeCompare(second.employee_name, "vi"));
  const handleOpenProfile = (employeeId: number, tab: ProfileTab): void => {
    setSelectedEmployeeId(employeeId);
    setSelectedTab(tab);
    setIsProfileModalOpen(true);
  };

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Cảnh báo giấy tờ</h1>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void loadData()} disabled={loading} className={systemSecondaryButton}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới</button>
        <button type="button" onClick={() => setIsConfigModalOpen(true)} className={systemSecondaryButton}><Settings className="h-4 w-4" aria-hidden="true" /> Cấu hình cảnh báo</button>
      </div>
    </div>
    <section className="rounded-sm border border-slate-200 bg-white" aria-label="Tìm kiếm và lọc cảnh báo giấy tờ">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-0 flex-1 basis-64"><label htmlFor="warning-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
          <input id="warning-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tên nhân sự, hộ chiếu, số giấy tờ…" className={systemField} /></div>
        <div className="w-full sm:w-60"><label htmlFor="warning-document-type" className="mb-1.5 block text-sm text-slate-600">Loại giấy tờ</label>
          <select id="warning-document-type" value={documentType} onChange={(event) => setDocumentType(event.target.value as "ALL" | DocumentType)} className={systemField}>
            <option value="ALL">Tất cả loại giấy tờ ({ready ? items.length : "—"})</option>
            {warningDocuments.map((document) => <option key={document.type} value={document.type}>{document.label} ({ready ? items.filter((item) => item.doc_type === document.type).length : "—"})</option>)}
          </select></div>
        {(query || documentType !== "ALL" || statusFilter !== "ALL") && <button type="button" onClick={() => { setQuery(""); setDocumentType("ALL"); setStatusFilter("ALL"); }} className={systemTextButton}>Xóa bộ lọc</button>}
      </div>
      <div className="border-t border-slate-200 px-4"><SystemTabs label="Lọc trạng thái giấy tờ" active={statusFilter} onChange={setStatusFilter} items={[
        { key: "ALL", label: "Tất cả", count: ready ? counts.ALL : undefined },
        { key: "EXPIRED", label: "Đã hết hạn", count: ready ? counts.EXPIRED : undefined },
        { key: "EXPIRING", label: "Sắp hết hạn", count: ready ? counts.EXPIRING : undefined },
        { key: "MISSING", label: "Thiếu thông tin", count: ready ? counts.MISSING : undefined },
      ]} /></div>
    </section>
    {ready && <p className="text-xs text-slate-600">Mốc cảnh báo: {warningDocuments.filter((document) => documentType === "ALL" || document.type === documentType).map((document) => `${document.label} ${warningThreshold(configs[document.type])}`).join(" · ")}</p>}
    <div aria-busy={loading}>
      {loading ? <div role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải cảnh báo giấy tờ…</div>
        : error ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-5 text-sm"><p className="text-red-800">{error}</p><button type="button" onClick={() => void loadData()} className={`${systemSecondaryButton} mt-3`}>Thử lại</button></div>
          : <DocumentWarningsTable items={filteredItems} onOpenProfile={handleOpenProfile} />}
    </div>
    <DocWarningConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} onSaved={() => void loadData()} />
    <EmployeeProfileModal employeeId={selectedEmployeeId} isOpen={isProfileModalOpen} initialTab={selectedTab}
      onClose={() => { setIsProfileModalOpen(false); void loadData(); }} onUpdate={() => void loadData()} />
  </div>;
}
