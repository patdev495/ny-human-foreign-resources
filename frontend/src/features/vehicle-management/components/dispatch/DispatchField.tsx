import type { InputHTMLAttributes, ReactNode } from "react";
import { systemField } from "../../../../shared/components/systemStyles";

export function DispatchField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block text-sm text-slate-700">
    <span className="mb-1 block">{label}{props.required && " *"}</span>
    <input {...props} className={systemField} />
  </label>;
}

export function DispatchSelectField({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm text-slate-700"><span className="mb-1 block">{label}</span>{children}</label>;
}
