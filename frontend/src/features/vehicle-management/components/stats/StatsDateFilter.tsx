import type { ReactNode } from "react";
import { systemField, systemSecondaryButton } from "../../../../shared/components/systemStyles";
import { dispatchToday } from "../dispatch/dispatchForm";

interface StatsDateFilterProps {
  fromDate: string;
  toDate: string;
  setFromDate: (value: string) => void;
  setToDate: (value: string) => void;
  children?: ReactNode;
  disabled?: boolean;
}

export function StatsDateFilter({ fromDate, toDate, setFromDate, setToDate, children, disabled }: StatsDateFilterProps) {
  return <fieldset disabled={disabled} className="flex flex-wrap items-end gap-3 rounded-sm border border-slate-200 bg-white p-4">
    <legend className="sr-only">Khoảng thời gian thống kê</legend>
    <label className="text-sm text-slate-700"><span className="mb-1 block">Từ ngày</span>
      <input type="date" value={fromDate} max={toDate || undefined} onChange={event => setFromDate(event.target.value)} className={systemField} />
    </label>
    <label className="text-sm text-slate-700"><span className="mb-1 block">Đến ngày</span>
      <input type="date" value={toDate} min={fromDate || undefined} onChange={event => setToDate(event.target.value)} className={systemField} />
    </label>
    <button type="button" onClick={() => { const today = dispatchToday(); setFromDate(`${today.slice(0, 7)}-01`); setToDate(today); }} className={systemSecondaryButton}>Tháng này</button>
    <button type="button" onClick={() => { setFromDate(""); setToDate(""); }} className={systemSecondaryButton}>Tất cả thời gian</button>
    {children}
  </fieldset>;
}

export function StatsLoadState({ loading, error, onRetry }: { loading: boolean; error: string | null; onRetry: () => void }) {
  if (loading) return <p role="status" className="py-6 text-sm text-slate-500">Đang tải thống kê…</p>;
  if (!error) return null;
  return <div role="alert" className="flex flex-wrap items-center gap-3 rounded-sm border border-red-200 bg-white p-4 text-sm text-red-700"><span>{error}</span>
    <button type="button" onClick={onRetry} className={systemSecondaryButton}>Thử lại</button>
  </div>;
}
