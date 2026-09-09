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
    accentBar: string;
  }
> = {
  default: {
    activeBorder: "border-slate-400",
    activeRing: "ring-2 ring-slate-400/20",
    iconBg: "bg-slate-100 text-slate-700 border-slate-200",
    iconColor: "text-slate-700",
    valueColor: "text-slate-900",
    bgHover: "hover:border-slate-300 hover:shadow-md",
    activeBg: "bg-white",
    accentBar: "bg-slate-500",
  },
  indigo: {
    activeBorder: "border-indigo-500",
    activeRing: "ring-2 ring-indigo-500/25",
    iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200/80 shadow-xs shadow-indigo-500/10",
    iconColor: "text-indigo-600",
    valueColor: "text-indigo-950",
    bgHover: "hover:border-indigo-300 hover:shadow-indigo-500/5 hover:shadow-md",
    activeBg: "bg-indigo-50/30",
    accentBar: "bg-indigo-600",
  },
  emerald: {
    activeBorder: "border-emerald-500",
    activeRing: "ring-2 ring-emerald-500/25",
    iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80 shadow-xs shadow-emerald-500/10",
    iconColor: "text-emerald-600",
    valueColor: "text-emerald-950",
    bgHover: "hover:border-emerald-300 hover:shadow-emerald-500/5 hover:shadow-md",
    activeBg: "bg-emerald-50/30",
    accentBar: "bg-emerald-600",
  },
  amber: {
    activeBorder: "border-amber-500",
    activeRing: "ring-2 ring-amber-500/25",
    iconBg: "bg-amber-50 text-amber-600 border-amber-200/80 shadow-xs shadow-amber-500/10",
    iconColor: "text-amber-600",
    valueColor: "text-amber-950",
    bgHover: "hover:border-amber-300 hover:shadow-amber-500/5 hover:shadow-md",
    activeBg: "bg-amber-50/30",
    accentBar: "bg-amber-500",
  },
  rose: {
    activeBorder: "border-rose-500",
    activeRing: "ring-2 ring-rose-500/25",
    iconBg: "bg-rose-50 text-rose-600 border-rose-200/80 shadow-xs shadow-rose-500/10",
    iconColor: "text-rose-600",
    valueColor: "text-rose-950",
    bgHover: "hover:border-rose-300 hover:shadow-rose-500/5 hover:shadow-md",
    activeBg: "bg-rose-50/30",
    accentBar: "bg-rose-600",
  },
  cyan: {
    activeBorder: "border-cyan-500",
    activeRing: "ring-2 ring-cyan-500/25",
    iconBg: "bg-cyan-50 text-cyan-600 border-cyan-200/80 shadow-xs shadow-cyan-500/10",
    iconColor: "text-cyan-600",
    valueColor: "text-cyan-950",
    bgHover: "hover:border-cyan-300 hover:shadow-cyan-500/5 hover:shadow-md",
    activeBg: "bg-cyan-50/30",
    accentBar: "bg-cyan-600",
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
      className={`relative w-full rounded-2xl p-5 text-left transition-all duration-200 overflow-hidden border ${
        active
          ? `${styles.activeBorder} ${styles.activeRing} ${styles.activeBg} shadow-sm -translate-y-0.5`
          : `bg-white/95 border-slate-200/90 ${styles.bgHover} shadow-2xs`
      } ${
        isInteractive
          ? "cursor-pointer hover:-translate-y-0.5 active:translate-y-0"
          : "cursor-default"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
              {badge}
            </span>
          )}
          {icon && (
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl border ${styles.iconBg} ${styles.iconColor}`}
            >
              {icon}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-3xl font-black font-mono tracking-tight ${styles.valueColor}`}>
          {value}
        </span>
      </div>

      {sublabel && (
        <p className="mt-1.5 text-xs font-medium text-slate-500 truncate">{sublabel}</p>
      )}

      {active && (
        <span
          className={`absolute bottom-0 left-0 right-0 h-1 ${styles.accentBar}`}
          aria-hidden="true"
        />
      )}
    </button>
  );
};
