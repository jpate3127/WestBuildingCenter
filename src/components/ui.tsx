import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The handful of primitives every page is built from. Mobile first: 16 px
 * gutters, 48 px tap targets, type that stays readable at 390 px.
 */

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("mx-auto w-full max-w-[1200px] px-4 sm:px-6", className)}>{children}</div>;
}

type SectionProps = { children: ReactNode; className?: string; id?: string; tone?: "white" | "paper" | "ink" | "cream" | "brand" };

const SECTION_TONES: Record<NonNullable<SectionProps["tone"]>, string> = {
  white: "bg-white text-ink",
  paper: "bg-paper text-ink",
  ink: "bg-ink text-white",
  cream: "bg-cream text-cream-ink",
  brand: "bg-brand text-white",
};

export function Section({ children, className, id, tone = "white" }: SectionProps) {
  return (
    <section id={id} className={cx(SECTION_TONES[tone], "py-12 sm:py-16 lg:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("eyebrow text-[15px] sm:text-[17px]", className)}>{children}</div>;
}

type HeadingProps = { children: ReactNode; className?: string; as?: "h1" | "h2" | "h3"; size?: "xl" | "lg" | "md" | "sm" };

const HEADING_SIZES: Record<NonNullable<HeadingProps["size"]>, string> = {
  xl: "text-[52px] sm:text-[72px] lg:text-[96px]",
  lg: "text-[36px] sm:text-[44px] lg:text-[52px]",
  md: "text-[30px] sm:text-[36px] lg:text-[44px]",
  sm: "text-[26px] sm:text-[30px]",
};

export function Heading({ children, className, as: Tag = "h2", size = "lg" }: HeadingProps) {
  return <Tag className={cx("display m-0", HEADING_SIZES[size], className)}>{children}</Tag>;
}

type ButtonVariant = "brand" | "ink" | "outline" | "outline-white" | "white";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  brand: "bg-brand text-white hover:bg-brand-dark",
  ink: "bg-ink text-white hover:bg-ink-3",
  outline: "border-2 border-ink text-ink hover:bg-ink hover:text-white",
  "outline-white": "border-2 border-white text-white hover:bg-white hover:text-ink",
  white: "bg-white text-ink hover:bg-paper",
};

const BUTTON_BASE =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded px-5 py-3 text-center font-bold leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-60";

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant; full?: boolean };

export function ButtonLink({ variant = "brand", full, className, ...props }: ButtonLinkProps) {
  return <Link {...props} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], full && "w-full", className)} />;
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; full?: boolean };

export function Button({ variant = "brand", full, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} className={cx(BUTTON_BASE, BUTTON_VARIANTS[variant], full && "w-full", className)} />;
}

export function Badge({ children, className, tone = "ink" }: { children: ReactNode; className?: string; tone?: "ink" | "brand" | "white" }) {
  const tones = { ink: "bg-ink text-white", brand: "bg-brand text-white", white: "bg-white text-ink" };
  return (
    <span className={cx("eyebrow inline-block rounded-sm px-2.5 py-0.5 text-[13px] tracking-[0.08em]", tones[tone], className)}>{children}</span>
  );
}

export function OpenDot({ open }: { open: boolean }) {
  return <span aria-hidden className={cx("inline-block h-2 w-2 rounded-full", open ? "bg-open" : "bg-muted")} />;
}

type FieldProps = { label: string; children: ReactNode; hint?: string; error?: string; className?: string };

export function Field({ label, children, hint, error, className }: FieldProps) {
  return (
    <label className={cx("flex flex-col gap-1.5 text-sm font-bold", className)}>
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-medium text-muted">{hint}</span> : null}
      {error ? (
        <span role="alert" className="text-xs font-semibold text-brand">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const INPUT_CLASS =
  "h-12 w-full rounded border border-[#bdbdbd] bg-white px-3 text-base font-medium text-ink placeholder:text-[#8a8a8a] focus:border-ink";
export const TEXTAREA_CLASS = "w-full rounded border border-[#bdbdbd] bg-white px-3 py-2.5 text-base font-medium text-ink placeholder:text-[#8a8a8a] focus:border-ink";

export function Input(props: ComponentProps<"input">) {
  return <input {...props} className={cx(INPUT_CLASS, props.className)} />;
}

export function Textarea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cx(TEXTAREA_CLASS, props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cx(INPUT_CLASS, props.className)} />;
}

/** Bots fill every field; people never see this one. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Leave this empty <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "success" | "error" }) {
  const tones = {
    info: "border-line bg-paper text-ink",
    success: "border-[#b7dcc0] bg-[#eaf6ed] text-[#14532d]",
    error: "border-[#f3b8c0] bg-[#fdecef] text-brand-dark",
  };
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("rounded border px-4 py-3 text-sm font-medium", tones[tone])}>
      {children}
    </div>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function PinIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function MessageIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
