import React from "react";
import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";
import type { ForeignEmployee } from "../../types";
import {
  getDays,
  classifyDays,
  type DocBadgeStatus,
} from "./docStatusUtils";

export { getDays, classifyDays, type DocBadgeStatus };
export { getEmployeeDocStatuses } from "./docStatusUtils";

const badgeConfig: Record<
  DocBadgeStatus,
  { label: (days: number | null) => string; cls: string; icon?: React.ReactNode }
> = {
  missing: {
    label: () => "Thiếu TT",
    cls: "bg-slate-100 text-slate-500 border-slate-200/80",
    icon: <AlertCircle className="h-3 w-3 text-slate-400 shrink-0" />,
  },
  expired: {
    label: (d) => (d !== null ? `Hết hạn (${d}d)` : "Hết hạn"),
    cls: "bg-rose-50 text-rose-700 border-rose-200 font-bold",
    icon: <AlertTriangle className="h-3 w-3 text-rose-500 shrink-0" />,
  },
  warning: {
    label: (d) => `${d} ngày`,
    cls: "bg-amber-50 text-amber-800 border-amber-200 font-bold",
    icon: <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />,
  },
  ok: {
    label: (d) => `${d} ngày`,
    cls: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    icon: <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />,
  },
};

export const DocBadge: React.FC<{
  dateStr?: string | null;
  label?: string;
  threshold: number;
}> = ({ dateStr, label, threshold }) => {
  const days = getDays(dateStr);
  const status = classifyDays(days, threshold);
  const config = badgeConfig[status];
  const text = label
    ? `${label}: ${
        status === "missing" ? "Thiếu TT" : status === "expired" ? "Hết hạn" : `${days} ngày`
      }`
    : config.label(days);

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium ${config.cls}`}
    >
      {config.icon}
      <span>{text}</span>
    </span>
  );
};

export const PassportBadge: React.FC<{ emp: ForeignEmployee; threshold: number }> = ({
  emp,
  threshold,
}) => {
  if (!emp.passport_number) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-slate-100 text-slate-500 border-slate-200/80">
        <AlertCircle className="h-3 w-3 text-slate-400" />
        <span>Hộ chiếu: Thiếu</span>
      </span>
    );
  }
  if (!emp.passport_expiry) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-medium bg-amber-50 text-amber-700 border-amber-200">
        <AlertTriangle className="h-3 w-3 text-amber-500" />
        <span>Hộ chiếu: Chưa có hạn</span>
      </span>
    );
  }
  return <DocBadge dateStr={emp.passport_expiry} label="HC" threshold={threshold} />;
};
