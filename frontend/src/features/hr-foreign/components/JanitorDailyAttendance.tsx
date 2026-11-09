import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { fetchDailyJanitorAttendance, resetJanitorAttendance, saveJanitorAbsence, type JanitorDailyAttendanceSheet } from "../api/janitorApi";
import { fetchEmployees } from "../api";
import type { ForeignEmployee } from "../types";
import { JanitorRangeAbsenceModal } from "./janitorial/JanitorRangeAbsenceModal";
import { JanitorAttendanceTable, type AttendanceChoice, type AttendanceFilter } from "./janitorial/JanitorAttendanceTable";
import { isJanitor, janitorLocations, type JanitorLocationFilter } from "./janitorial/janitorUtils";
import { vietnamDate } from "./meal-forecast/vietnamDate";
import { SystemTabs } from "../../../shared/components/SystemTabs";
import { systemField, systemPrimaryButton, systemSecondaryButton, systemTextButton } from "../../../shared/components/systemStyles";

export function JanitorDailyAttendance() {
  const [targetDate, setTargetDate] = useState(vietnamDate);
  const [sheet, setSheet] = useState<JanitorDailyAttendanceSheet | null>(null);
  const [employees, setEmployees] = useState<ForeignEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<JanitorLocationFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<AttendanceFilter>("ALL");
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const requestSequence = useRef(0);

  const loadData = useCallback(async (date: string): Promise<void> => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setLoadError(null);
    try {
      const [attendance, people] = await Promise.all([fetchDailyJanitorAttendance(date), fetchEmployees()]);
      if (sequence !== requestSequence.current) return;
      setSheet(attendance);
      setEmployees(people.filter(isJanitor));
    } catch {
      if (sequence === requestSequence.current) setLoadError("Không thể tải điểm danh tạp vụ. Kiểm tra kết nối rồi thử lại.");
    } finally { if (sequence === requestSequence.current) setLoading(false); }
  }, []);
  useEffect(() => {
    setSaveError(null);
    void loadData(targetDate);
    return () => { requestSequence.current += 1; };
  }, [targetDate, loadData]);

  const handleStatusChange = async (employeeId: number, type: AttendanceChoice, reason: string): Promise<void> => {
    if (savingId !== null) return;
    setSavingId(employeeId);
    setSaveError(null);
    try {
      if (type === "PRESENT") await resetJanitorAttendance(employeeId, targetDate);
      else await saveJanitorAbsence({ employee_id: employeeId, attendance_date: targetDate, absence_type: type, reason: reason.trim() || undefined });
      await loadData(targetDate);
    } catch (cause: unknown) { setSaveError(cause instanceof Error ? cause.message : "Không thể lưu điểm danh tạp vụ."); }
    finally { setSavingId(null); }
  };
  const shiftDate = (days: number): void => {
    const date = new Date(`${targetDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    setTargetDate(date.toISOString().slice(0, 10));
  };
  const currentSheet = !loading && !loadError && sheet?.date === targetDate ? sheet : null;
  const filteredItems = (currentSheet?.items || []).filter((item) => {
    if (locationFilter !== "ALL" && (item.workplace_location || "DORMITORY") !== locationFilter) return false;
    if (statusFilter === "PRESENT" && item.status !== "PRESENT") return false;
    if (statusFilter === "FULL_DAY" && item.absence_type !== "FULL_DAY") return false;
    if (statusFilter === "HALF_DAY" && item.absence_type !== "HALF_DAY") return false;
    const query = searchQuery.trim().toLocaleLowerCase();
    return !query || [item.name_latin, item.name_chinese, item.employee_code].some((value) => value?.toLocaleLowerCase().includes(query));
  });

  return <div className="min-w-0 space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Điểm danh tạp vụ hằng ngày</h1>
      <button type="button" onClick={() => setIsRangeModalOpen(true)} disabled={loading || savingId !== null || Boolean(loadError)} className={systemPrimaryButton}><CalendarRange className="h-4 w-4" aria-hidden="true" /> Đăng ký nghỉ theo đợt</button>
    </div>
    <p className="text-sm text-slate-600">Mặc định đi làm đủ 1 công. Ghi nhận nghỉ cả ngày hoặc nửa ngày; lý do nghỉ được lưu khi rời ô nhập.</p>
    <section className="rounded-sm border border-slate-200 bg-white" aria-label="Ngày và bộ lọc điểm danh">
      <div className="flex flex-wrap items-end gap-3 p-4">
        <div><label htmlFor="attendance-date" className="mb-1.5 block text-sm text-slate-600">Ngày điểm danh</label>
          <input id="attendance-date" type="date" required value={targetDate} disabled={savingId !== null} onChange={(event) => { if (event.target.value) setTargetDate(event.target.value); }} className={`${systemField} w-auto`} /></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => shiftDate(-1)} disabled={savingId !== null} aria-label="Ngày trước" className={systemSecondaryButton}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => setTargetDate(vietnamDate())} disabled={savingId !== null} className={systemSecondaryButton}>Hôm nay</button>
          <button type="button" onClick={() => shiftDate(1)} disabled={savingId !== null} aria-label="Ngày sau" className={systemSecondaryButton}><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" onClick={() => void loadData(targetDate)} disabled={loading || savingId !== null} className={systemSecondaryButton}><RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Làm mới</button>
        </div>
        <div className="min-w-0 flex-1 basis-52"><label htmlFor="attendance-search" className="mb-1.5 block text-sm text-slate-600">Tìm kiếm</label>
          <input id="attendance-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Tên, mã nhân sự…" className={systemField} /></div>
        <div className="w-full sm:w-48"><label htmlFor="attendance-location" className="mb-1.5 block text-sm text-slate-600">Nơi làm việc</label>
          <select id="attendance-location" value={locationFilter} onChange={(event) => setLocationFilter(event.target.value as JanitorLocationFilter)} className={systemField}>
            <option value="ALL">Tất cả nơi làm việc</option>{janitorLocations.map((location) => <option key={location.value} value={location.value}>{location.label}</option>)}
          </select></div>
        {(searchQuery || locationFilter !== "ALL" || statusFilter !== "ALL") && <button type="button" onClick={() => { setSearchQuery(""); setLocationFilter("ALL"); setStatusFilter("ALL"); }} className={systemTextButton}>Xóa bộ lọc</button>}
      </div>
      <div className="border-t border-slate-200 px-4"><SystemTabs label="Lọc trạng thái điểm danh" active={statusFilter} onChange={setStatusFilter} items={[
        { key: "ALL", label: "Tất cả", count: currentSheet?.total_count },
        { key: "PRESENT", label: "Đi làm", count: currentSheet?.present_count },
        { key: "FULL_DAY", label: "Nghỉ cả ngày", count: currentSheet?.full_day_absence_count },
        { key: "HALF_DAY", label: "Nghỉ nửa ngày", count: currentSheet?.half_day_absence_count },
      ]} /></div>
    </section>
    {saveError && <p role="alert" className="rounded-sm border border-red-200 bg-white p-3 text-sm text-red-800">{saveError}</p>}
    {loadError ? <div role="alert" className="rounded-sm border border-red-200 bg-white p-4 text-sm"><p className="text-red-800">{loadError}</p><button type="button" onClick={() => void loadData(targetDate)} className={`${systemSecondaryButton} mt-2`}>Thử lại</button></div>
      : !currentSheet ? <p role="status" className="rounded-sm border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Đang tải điểm danh tạp vụ…</p>
        : <JanitorAttendanceTable key={targetDate} items={filteredItems} savingId={savingId} onChange={handleStatusChange} />}
    <JanitorRangeAbsenceModal isOpen={isRangeModalOpen} onClose={() => setIsRangeModalOpen(false)} employees={employees} onSuccess={() => void loadData(targetDate)} />
  </div>;
}
