import Link from "next/link";
import type { ReactNode } from "react";

import { Notice, cx } from "@/components/ui";

/**
 * Server-safe building blocks for admin pages: page headers, cards, status
 * pills, flash notices from the query string. Plain and thumb-sized.
 */

export function PageHeader({ title, back, action, children }: { title: string; back?: { href: string; label: string }; action?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-5">
      {back ? (
        <Link href={back.href} className="text-[14px] font-semibold text-muted hover:text-ink">
          ← {back.label}
        </Link>
      ) : null}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="display m-0 text-[32px] sm:text-[40px]">{title}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}

export function Card({ children, className, title }: { children: ReactNode; className?: string; title?: string }) {
  return (
    <section className={cx("rounded-md border border-line bg-white p-4 sm:p-5", className)}>
      {title ? <h2 className="eyebrow m-0 mb-3 text-[13px] text-muted">{title}</h2> : null}
      {children}
    </section>
  );
}

type PillTone = "green" | "yellow" | "gray" | "red" | "ink" | "brand";

const PILL_TONES: Record<PillTone, string> = {
  green: "bg-[#eaf6ed] text-[#14532d]",
  yellow: "bg-[#fff4d6] text-[#7a4b00]",
  gray: "bg-paper text-muted",
  red: "bg-[#fdecef] text-brand-dark",
  ink: "bg-ink text-white",
  brand: "bg-brand text-white",
};

export function Pill({ children, tone = "gray", className }: { children: ReactNode; tone?: PillTone; className?: string }) {
  return <span className={cx("inline-block whitespace-nowrap rounded-sm px-2 py-0.5 text-[12px] font-bold uppercase tracking-[0.06em]", PILL_TONES[tone], className)}>{children}</span>;
}

/** NONE/PENDING/ACTIVE/STOPPED and friends as a colored pill. */
export function StatusPill({ status }: { status: string }) {
  const tone: PillTone =
    status === "ACTIVE" || status === "PUBLISHED" || status === "DONE" || status === "REPLIED"
      ? "green"
      : status === "PENDING" || status === "SUBMITTED" || status === "QUEUED" || status === "SENDING" || status === "NEW"
        ? "yellow"
        : status === "STOPPED" || status === "FAILED"
          ? "red"
          : "gray";
  return <Pill tone={tone}>{status.toLowerCase()}</Pill>;
}

/** Shows ?error= and ?ok= from the page's searchParams. */
export function Flash({ params }: { params: { error?: string | string[]; ok?: string | string[]; saved?: string | string[]; sent?: string | string[] } }) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const error = one(params.error);
  const ok = one(params.ok);
  const saved = one(params.saved);
  const sent = one(params.sent);
  if (!error && !ok && !saved && !sent) return null;
  return (
    <div className="mb-4 flex flex-col gap-2">
      {error ? <Notice tone="error">{error}</Notice> : null}
      {ok ? <Notice tone="success">{ok}</Notice> : null}
      {saved ? <Notice tone="success">Saved.</Notice> : null}
      {sent ? <Notice tone="success">Alert queued. Counts update below as messages go out; refresh in a minute.</Notice> : null}
    </div>
  );
}

export function Empty({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("m-0 rounded border border-dashed border-line px-4 py-6 text-center text-[15px] text-muted", className)}>{children}</p>;
}

export function CheckboxRow({ name, label, hint, defaultChecked, disabled, value }: { name: string; label: ReactNode; hint?: ReactNode; defaultChecked?: boolean; disabled?: boolean; value?: string }) {
  return (
    <label className={cx("flex min-h-12 items-start gap-3 rounded border border-line px-3 py-2.5", disabled ? "opacity-60" : "")}>
      <input type="checkbox" name={name} value={value ?? "on"} defaultChecked={defaultChecked} disabled={disabled} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
      <span className="text-[15px] font-semibold leading-snug">
        {label}
        {hint ? <span className="block text-[13px] font-medium text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

/** Horizontal, scrollable filter chips (tabs) built from links. */
export function Chips({ items }: { items: Array<{ href: string; label: ReactNode; active: boolean }> }) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cx("inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-[14px] font-semibold", item.active ? "border-ink bg-ink text-white" : "border-line bg-white text-ink")}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export function Count({ n }: { n: number }) {
  return <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{n}</span>;
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="m-0 grid grid-cols-[minmax(90px,30%)_1fr] gap-x-3 gap-y-1.5 text-[15px]">
      {items.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="m-0 font-semibold text-muted">{k}</dt>
          <dd className="m-0 break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Tile({ href, label, value, tone }: { href: string; label: string; value: number | string; tone?: "brand" }) {
  return (
    <Link href={href} className={cx("flex flex-col rounded-md border p-4", tone === "brand" ? "border-brand bg-brand text-white" : "border-line bg-white text-ink")}>
      <span className="display text-[40px] leading-none">{value}</span>
      <span className={cx("mt-1 text-[14px] font-semibold", tone === "brand" ? "text-white/90" : "text-muted")}>{label}</span>
    </Link>
  );
}
