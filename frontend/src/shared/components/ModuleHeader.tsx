import React from "react";
import type { LucideIcon } from "lucide-react";

export type ModuleTheme = "indigo" | "emerald" | "cyan" | "amber" | "rose" | "purple";

export interface HeaderTabItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  theme?: ModuleTheme;
  actions?: React.ReactNode;
  tabs?: HeaderTabItem[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  children?: React.ReactNode;
}

const themeStyles: Record<
  ModuleTheme,
  {
    gradient: string;
    iconBg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    activeTabBg: string;
    activeTabText: string;
  }
> = {
  indigo: {
    gradient: "from-slate-900 via-indigo-950 to-slate-900",
    iconBg: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
    border: "border-indigo-800/40",
    badgeBg: "bg-indigo-500/20",
    badgeText: "text-indigo-200 border-indigo-400/30",
    activeTabBg: "bg-indigo-500 text-white shadow-indigo-500/25",
    activeTabText: "text-white",
  },
  emerald: {
    gradient: "from-slate-900 via-emerald-950 to-slate-900",
    iconBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
    border: "border-emerald-800/40",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-200 border-emerald-400/30",
    activeTabBg: "bg-emerald-500 text-white shadow-emerald-500/25",
    activeTabText: "text-white",
  },
  cyan: {
    gradient: "from-slate-900 via-cyan-950 to-slate-900",
    iconBg: "bg-cyan-500/20 text-cyan-300 border-cyan-400/30",
    border: "border-cyan-800/40",
    badgeBg: "bg-cyan-500/20",
    badgeText: "text-cyan-200 border-cyan-400/30",
    activeTabBg: "bg-cyan-500 text-white shadow-cyan-500/25",
    activeTabText: "text-white",
  },
  amber: {
    gradient: "from-slate-900 via-amber-950 to-slate-900",
    iconBg: "bg-amber-500/20 text-amber-300 border-amber-400/30",
    border: "border-amber-800/40",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-200 border-amber-400/30",
    activeTabBg: "bg-amber-500 text-white shadow-amber-500/25",
    activeTabText: "text-white",
  },
  rose: {
    gradient: "from-slate-900 via-rose-950 to-slate-900",
    iconBg: "bg-rose-500/20 text-rose-300 border-rose-400/30",
    border: "border-rose-800/40",
    badgeBg: "bg-rose-500/20",
    badgeText: "text-rose-200 border-rose-400/30",
    activeTabBg: "bg-rose-500 text-white shadow-rose-500/25",
    activeTabText: "text-white",
  },
  purple: {
    gradient: "from-slate-900 via-purple-950 to-slate-900",
    iconBg: "bg-purple-500/20 text-purple-300 border-purple-400/30",
    border: "border-purple-800/40",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-200 border-purple-400/30",
    activeTabBg: "bg-purple-500 text-white shadow-purple-500/25",
    activeTabText: "text-white",
  },
};

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  theme = "indigo",
  actions,
  tabs,
  activeTab,
  onTabChange,
  children,
}) => {
  const currentTheme = themeStyles[theme] || themeStyles.indigo;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${currentTheme.gradient} p-5 sm:p-6 text-white shadow-lg border ${currentTheme.border}`}
    >
      {/* Ambient background glow effect */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Left Section: Icon & Title */}
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${currentTheme.iconBg} backdrop-blur-md shadow-inner`}
          >
            <Icon className="h-6 w-6" strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h1>
              {badgeText && (
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
                >
                  {badgeText}
                </span>
              )}
            </div>

            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-slate-300/90 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right Section: Actions or Custom Children */}
        {(actions || children) && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
            {children}
            {actions}
          </div>
        )}
      </div>

      {/* Optional Segmented Tabs Bar */}
      {tabs && tabs.length > 0 && onTabChange && (
        <div className="relative mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-1.5">
          <div className="inline-flex p-1 rounded-xl bg-slate-950/40 backdrop-blur-md border border-white/10">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? `${currentTheme.activeTabBg} shadow-sm font-bold`
                      : "text-slate-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isActive ? "bg-white/25 text-white" : "bg-white/10 text-slate-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
