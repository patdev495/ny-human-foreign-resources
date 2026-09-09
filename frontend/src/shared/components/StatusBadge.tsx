import React from "react";

export type BadgeStatus = "success" | "warning" | "danger" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  status?: BadgeStatus;
  pulse?: boolean;
  className?: string;
}

const statusStyles: Record<
  BadgeStatus,
  {
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  danger: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  info: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
  neutral: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  status = "neutral",
  pulse = false,
  className = "",
}) => {
  const current = statusStyles[status] || statusStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border} ${className}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${current.dot} opacity-75`}
          />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${current.dot}`} />
      </span>
      <span>{label}</span>
    </span>
  );
};
