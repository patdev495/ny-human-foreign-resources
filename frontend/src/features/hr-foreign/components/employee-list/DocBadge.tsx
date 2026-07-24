import React from "react";
import type { ForeignEmployee } from "../../types";

export const getDays = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const targetTime = new Date(dateStr).getTime();
  const todayTime = new Date().setHours(0, 0, 0, 0);
  return Math.ceil((targetTime - todayTime) / (1000 * 60 * 60 * 24));
};

export type DocBadgeStatus = "missing" | "expired" | "warning" | "ok";

export const classifyDays = (days: number | null, threshold: number): DocBadgeStatus => {
  if (days === null) return "missing";
  if (days <= 0) return "expired";
  if (days <= threshold) return "warning";
  return "ok";
};

const badgeConfig: Record<
  DocBadgeStatus,
  { label: (days: number | null) => string; cls: string }
> = {
  missing:  { label: () => "Thiếu TT",          cls: "bg-slate-100 text-slate-500 border-slate-200" },
  expired:  { label: (d) => (d !== null ? `Hết hạn (${d}d)` : "Hết hạn"), cls: "bg-red-100 text-red-800 border-red-300 font-bold" },
  warning:  { label: (d) => `${d} ngày`,         cls: "bg-amber-100 text-amber-800 border-amber-300 font-bold" },
  ok:       { label: (d) => `${d} ngày`,         cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

export const DocBadge: React.FC<{ dateStr?: string | null; label?: string; threshold: number }> = ({ dateStr, label, threshold }) => {
  const days = getDays(dateStr);
  const status = classifyDays(days, threshold);
  const { label: getLabel, cls } = badgeConfig[status];
  const text = label
    ? `${label}: ${status === "missing" ? "Thiếu TT" : status === "expired" ? "Hết hạn" : `${days} ngày`}`
    : getLabel(days);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold ${cls}`}>
      {status === "missing" && <span className="mr-1 opacity-60">–</span>}
      {status === "expired" && <span className="mr-1">⚠</span>}
      {text}
    </span>
  );
};

export const PassportBadge: React.FC<{ emp: ForeignEmployee; threshold: number }> = ({ emp, threshold }) => {
  if (!emp.passport_number) {
    return <span className="inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold bg-slate-100 text-slate-500 border-slate-200">Thiếu TT</span>;
  }
  if (!emp.passport_expiry) {
    return (
      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded border text-[11px] font-semibold bg-amber-50 text-amber-600 border-amber-200">
        <span>⚠</span> Chưa có hạn
      </span>
    );
  }
  return <DocBadge dateStr={emp.passport_expiry} threshold={threshold} />;
};

export const getEmployeeDocStatuses = (emp: ForeignEmployee, threshold: number): DocBadgeStatus[] => {
  const passportStatus: DocBadgeStatus = !emp.passport_number
    ? "missing"
    : !emp.passport_expiry
    ? "warning"
    : classifyDays(getDays(emp.passport_expiry), threshold);

  const gpldStatus = classifyDays(getDays(emp.latest_gpld_expiry), threshold);
  const visaStatus = classifyDays(getDays(emp.latest_visa_expiry), threshold);
  const tamtruStatus = classifyDays(getDays(emp.latest_tamtru_expiry), threshold);
  const contractStatus = classifyDays(getDays(emp.latest_contract_expiry), threshold);

  return [passportStatus, gpldStatus, visaStatus, tamtruStatus, contractStatus];
};
