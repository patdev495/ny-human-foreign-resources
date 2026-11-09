interface SystemTabsProps<Key extends string> {
  label: string;
  items: { key: Key; label: string; count?: number }[];
  active: Key;
  onChange: (key: Key) => void;
}

export function SystemTabs<Key extends string>({ label, items, active, onChange }: SystemTabsProps<Key>) {
  return <div role="group" aria-label={label} className="flex flex-wrap gap-x-5 border-b border-slate-200">
    {items.map((item) => <button type="button" key={item.key} aria-pressed={active === item.key} onClick={() => onChange(item.key)}
      className={`min-h-11 cursor-pointer border-b-2 py-2 text-sm ${active === item.key ? "border-slate-700 font-semibold text-slate-900" : "border-transparent text-slate-600 hover:text-slate-900"}`}>
      {item.label}{item.count !== undefined && <span className="ml-1 tabular-nums text-slate-500">({item.count})</span>}
    </button>)}
  </div>;
}
