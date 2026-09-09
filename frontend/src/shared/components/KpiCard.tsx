import React from "react";

export type KpiVariant = "default" | "indigo" | "emerald" | "amber" | "rose" | "cyan";

interface KpiCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant?: KpiVariant;
  badge?: string;
}

const variantStyles: Record<
  KpiVariant,
  {
    activeBorder: string;
    activeRing: string;
    iconBg: string;
    iconColor: string;
    valueColor: string;
    bgHover: string;
    activeBg: string;
  }
> = {
  default: {
    activeBorder: "border-slate-400",
    activeRing: "ring-2 ring-slate-400/20",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    valueColor: "text-slate-900",
    bgHover: "hover:border-slate-300",
    activeBg: "bg-white",
  },
  indigo: {
    activeBorder: "border-indigo-500",
    activeRing: "ring-2 ring-indigo-500/20",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    valueColor: "text-indigo-950",
    bgHover: "hover:border-indigo-300",
    activeBg: "bg-indigo-50/40",
  },
  emerald: {
    activeBorder: "border-emerald-500",
    activeRing: "ring-2 ring-emerald-500/20",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-950",
    bgHover: "hover:border-emerald-300",
    activeBg: "bg-emerald-50/40",
  },
  amber: {
    activeBorder: "border-amber-500",
    activeRing: "ring-2 ring-amber-500/20",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    valueColor: "text-amber-950",
    bgHover: "hover:border-amber-300",
    activeBg: "bg-amber-50/40",
  },
  rose: {
    activeBorder: "border-rose-500",
    activeRing: "ring-2 ring-rose-500/20",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
    valueColor: "text-rose-950",
    bgHover: "hover:border-rose-300",
    activeBg: "bg-rose-50/40",
  },
  cyan: {
    activeBorder: "border-cyan-500",
    activeRing: "ring-2 ring-cyan-500/20",
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-600",
    valueColor: "text-cyan-950",
    bgHover: "hover:border-cyan-300",
    activeBg: "bg-cyan-50/40",
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  active = false,
  onClick,
  variant = "default",
  badge,
}) => {
  const styles = variantStyles[variant] || variantStyles.default;
  const isInteractive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isInteractive}
      className={`relative w-full rounded-2xl p-4.5 text-left transition-all duration-200 overflow-hidden border ${
        active
          ? `${styles.activeBorder} ${styles.activeRing} ${styles.activeBg} shadow-sm -translate-y-0.5`
          : `bg-white border-slate-200/90 ${styles.bgHover} shadow-2xs`
      } ${
        isInteractive
          ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
          : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 tracking-tight">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
              {badge}
            </span>
          )}
          {icon && (
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles.iconBg} ${styles.iconColor}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-black font-mono tracking-tight ${styles.valueColor}`}>
          {value}
        </span>
      </div>

      {sublabel && (
        <p className="mt-1 text-[11px] font-medium text-slate-500 truncate">{sublabel}</p>
      )}

      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-1 bg-current opacity-60"
          aria-hidden="true"
        />
      )}
    </button>
  );
};
