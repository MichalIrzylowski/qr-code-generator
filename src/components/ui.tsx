import type { ReactNode } from "react";
import { msg } from "@/messages/index.ts";

export const Panel = ({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) => (
  <section className="rounded-xl border border-line bg-surface p-4 shadow-sm">
    <header className="mb-3">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </header>
    <div className="space-y-3">{children}</div>
  </section>
);

export const Field = ({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
  </label>
);

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

export const Select = <T extends string>({
  value,
  onChange,
  options,
  disabled,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  disabled?: boolean;
}) => (
  <select
    className={inputClass + (disabled ? " opacity-50" : "")}
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value as T)}
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

export const ColorInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="flex items-center gap-2">
    <input
      type="color"
      aria-label={msg("a11y.colorPicker")}
      className="h-9 w-10 shrink-0 cursor-pointer rounded-lg border border-line bg-surface p-1"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <input
      className={inputClass + " font-mono"}
      value={value}
      spellCheck={false}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

export const Slider = ({
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onChange(Number(e.target.value))}
    />
    <span className="w-12 shrink-0 text-right font-mono text-xs text-muted">
      {format ? format(value) : value}
    </span>
  </div>
);

export const Toggle = ({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <label className={"flex items-center gap-2 text-sm " + (disabled ? "opacity-50" : "cursor-pointer")}>
    <input
      type="checkbox"
      className="h-4 w-4 rounded border-line accent-accent"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    {label}
  </label>
);

export const Button = ({
  children,
  onClick,
  variant = "secondary",
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  title?: string;
}) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={
      "rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 " +
      (variant === "primary"
        ? "bg-accent text-white hover:bg-accent/90"
        : "border border-line bg-surface hover:bg-canvas")
    }
  >
    {children}
  </button>
);

export const Disclosure = ({ label, children }: { label: string; children: ReactNode }) => (
  <details className="group rounded-lg border border-line bg-canvas/60 px-3 py-2">
    <summary className="cursor-pointer list-none text-xs font-medium text-muted select-none">
      <span className="inline-block transition group-open:rotate-90">▸</span> {label}
    </summary>
    <div className="mt-3 space-y-3">{children}</div>
  </details>
);
