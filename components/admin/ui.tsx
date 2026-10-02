"use client";

// Shared building blocks for the admin dashboard. Every page uses these so the
// look stays consistent: warm blue (ink), white, graphite and soft neutrals,
// serif headings, pill-shaped controls and large rounded surfaces.

import { useEffect } from "react";

// ─── Layout ──────────────────────────────────────────────────────────────────

export function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`px-5 pt-10 pb-12 md:px-12 md:pt-12 md:pb-20 mx-auto w-full ${wide ? "max-w-[1240px]" : "max-w-[1080px]"}`}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 mb-8 md:mb-10 fade-up">
      <div className="min-w-0">
        <h1 className="font-serif text-[2.75rem] md:text-[3.5rem] font-light leading-none tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 font-serif italic text-[17px] md:text-[19px] text-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

// A serif section heading. Pass the italic word separately for the brand rhythm:
// <SectionTitle italic="appointments">Today's</SectionTitle>
export function SectionTitle({
  children,
  italic,
  action,
}: {
  children?: React.ReactNode;
  italic?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 mb-4">
      <h2 className="font-serif text-[24px] md:text-[26px] font-normal text-ink leading-tight">
        {children}
        {children && italic ? " " : null}
        {italic && <span className="italic">{italic}</span>}
      </h2>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={`bg-paper border border-line rounded-[24px] ${padded ? "p-5 md:p-7" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ─── Buttons ─────────────────────────────────────────────────────────────────

type ButtonVariant = "primary" | "secondary" | "ghost" | "light";

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper hover:bg-ink/90",
  secondary: "border border-[#D5D7DB] text-ink hover:border-ink bg-paper",
  ghost: "text-muted hover:text-ink",
  light: "bg-paper text-ink hover:bg-paper/90",
};

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "sm" = "md") {
  const sizing = size === "sm" ? "h-9 px-4 text-[13px]" : "h-11 px-5 text-[14px]";
  return `inline-flex items-center justify-center gap-2 rounded-full font-sans font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${sizing} ${BUTTON_STYLES[variant]}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: "md" | "sm" }) {
  return <button type="button" {...props} className={`${buttonClass(variant, size)} ${className}`} />;
}

export function IconButton({
  label,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={`w-11 h-11 flex-shrink-0 inline-flex items-center justify-center rounded-full text-muted hover:text-ink hover:bg-soft transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Status ──────────────────────────────────────────────────────────────────

export type PillTone = "solid" | "outline" | "soft" | "struck";

const PILL_STYLES: Record<PillTone, string> = {
  solid: "bg-ink text-paper",
  outline: "border border-[#D5D7DB] text-ink",
  soft: "bg-soft text-muted",
  struck: "bg-soft text-muted line-through",
};

export function Pill({ tone = "soft", children, className = "" }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-full font-sans text-[12px] whitespace-nowrap ${PILL_STYLES[tone]} ${className}`}>
      {children}
    </span>
  );
}

// A small count bubble, e.g. on a tab or nav item.
export function Count({ n, inverted = false }: { n: number; inverted?: boolean }) {
  return (
    <span
      className={`min-w-[18px] h-[18px] px-[5px] inline-flex items-center justify-center rounded-full text-[11px] font-medium leading-none ${
        inverted ? "bg-paper text-ink" : "bg-ink text-paper"
      }`}
    >
      {n}
    </span>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className = "",
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={`inline-flex gap-1 p-1 rounded-full bg-soft max-w-full overflow-x-auto hide-scrollbar ${className}`}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`h-9 px-4 inline-flex items-center gap-2 rounded-full font-sans text-[13px] whitespace-nowrap transition-colors ${
              on ? "bg-ink text-paper" : "text-graphite hover:text-ink"
            }`}
          >
            {o.label}
            {!!o.count && <Count n={o.count} inverted={on} />}
          </button>
        );
      })}
    </div>
  );
}

// ─── Forms ───────────────────────────────────────────────────────────────────

export const inputClass =
  "w-full h-12 px-4 rounded-2xl bg-soft border border-transparent font-sans text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:bg-paper focus:border-ink/30 transition-colors";

export const textareaClass =
  "w-full px-4 py-3 rounded-2xl bg-soft border border-transparent font-sans text-[14px] text-ink placeholder:text-muted/70 focus:outline-none focus:bg-paper focus:border-ink/30 transition-colors resize-none";

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="block mb-2 font-sans text-[13px] text-graphite">{label}</span>
      {children}
      {hint && <span className="block mt-1.5 font-sans text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`flex items-center gap-2.5 h-11 px-4 rounded-full bg-soft text-muted ${className}`}>
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none font-sans text-[14px] text-ink placeholder:text-muted"
      />
    </label>
  );
}

// ─── Feedback ────────────────────────────────────────────────────────────────

export function ErrorNote({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return <p role="alert" className={`font-sans text-[13px] text-red-700 ${className}`}>{children}</p>;
}

export function Empty({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="py-16 text-center">
      <p className="font-serif italic text-[22px] text-graphite">{title}</p>
      {children && <div className="mt-3 font-sans text-[13px] text-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-soft ${className}`} />;
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-[68px]" />
      ))}
    </div>
  );
}

// ─── Overlays ────────────────────────────────────────────────────────────────

// Open overlays, oldest first. Escape closes only the top one, so a confirm
// dialog stacked on a modal doesn't take the modal down with it.
const overlayStack: symbol[] = [];

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const id = Symbol("overlay");
    overlayStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && overlayStack[overlayStack.length - 1] === id) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      overlayStack.splice(overlayStack.indexOf(id), 1);
    };
  }, [open, onClose]);
}

export const CloseIcon = (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// Centered dialog on desktop, bottom sheet on mobile.
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEscape(open, onClose);
  if (!open) return null;
  const width = size === "sm" ? "md:max-w-[420px]" : size === "lg" ? "md:max-w-[780px]" : "md:max-w-[560px]";
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6">
      <div className="absolute inset-0 bg-ink/45" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${width} max-h-[92vh] flex flex-col bg-paper rounded-t-[28px] md:rounded-[28px] shadow-[0_24px_64px_rgba(26,33,43,0.25)] animate-[slideUp_0.3s_cubic-bezier(0.16,1,0.3,1)] md:animate-none pb-[env(safe-area-inset-bottom)]`}
      >
        <div className="flex items-start justify-between gap-4 px-6 md:px-8 pt-6 md:pt-7 pb-2">
          <h3 className="font-serif text-[28px] md:text-[30px] font-light leading-tight text-ink">{title}</h3>
          <IconButton label="Close" onClick={onClose} className="-mr-3 -mt-1">{CloseIcon}</IconButton>
        </div>
        <div className="px-6 md:px-8 pt-2 pb-6 overflow-y-auto">{children}</div>
        {footer && <div className="px-6 md:px-8 py-5 border-t border-line flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// A short yes/no confirmation built on Modal.
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  busy = false,
  error,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  error?: string;
  onConfirm: () => void;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Go back</Button>
          <Button onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</Button>
        </>
      }
    >
      {body && <p className="font-sans text-[14px] leading-relaxed text-graphite">{body}</p>}
      {children && <div className="mt-5">{children}</div>}
      <ErrorNote className="mt-4">{error}</ErrorNote>
    </Modal>
  );
}
