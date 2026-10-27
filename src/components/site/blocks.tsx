import Link from "next/link";
import type { ReactNode } from "react";

import { MediaImage } from "@/components/MediaImage";
import { ButtonLink, Container, Eyebrow, Heading, OpenDot, PhoneIcon, cx } from "@/components/ui";
import { paragraphs } from "@/lib/content";
import { isOpenNow } from "@/lib/hours";
import { ADDRESS_LINE, SITE } from "@/lib/site";

/**
 * Pieces the inner pages share: a page header band, the visit/hours card,
 * the call-us block, stacked photo galleries, paragraph text. All server-safe.
 */

type Tone = "white" | "paper" | "ink" | "cream" | "brand";

const HEADER_TONES: Record<Tone, string> = {
  white: "bg-white text-ink",
  paper: "bg-paper text-ink",
  ink: "bg-ink text-white",
  cream: "bg-cream text-cream-ink",
  brand: "bg-brand text-white",
};

const EYEBROW_TONES: Record<Tone, string> = {
  white: "text-brand",
  paper: "text-brand",
  ink: "text-brand-tint",
  cream: "text-cream-dark",
  brand: "text-white/90",
};

/** Like Section but with no vertical padding of its own: pass exactly the padding you want. */
export function Band({ children, className, id, tone = "white" }: { children: ReactNode; className?: string; id?: string; tone?: Tone }) {
  return (
    <section id={id} className={cx(HEADER_TONES[tone], className)}>
      <Container>{children}</Container>
    </section>
  );
}

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  text?: string;
  tone?: Tone;
  /** Buttons or extra lines under the text. */
  children?: ReactNode;
  /** Keep the headline in sentence case (long, conversational titles). */
  plain?: boolean;
};

export function PageHeader({ eyebrow, title, text, tone = "paper", children, plain }: PageHeaderProps) {
  return (
    <Band tone={tone} className="py-10 sm:py-14">
      {eyebrow ? <Eyebrow className={EYEBROW_TONES[tone]}>{eyebrow}</Eyebrow> : null}
      <Heading as="h1" size="lg" className={cx(eyebrow && "mt-2", plain && "normal-case tracking-normal")}>
        {title}
      </Heading>
      {text ? <p className="mt-4 max-w-[640px] text-[17px] sm:text-[19px]">{text}</p> : null}
      {children ? <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div> : null}
    </Band>
  );
}

/** Owner-typed text, blank lines between paragraphs. */
export function Prose({ text, className }: { text: string | null | undefined; className?: string }) {
  if (!text?.trim()) return null;
  return (
    <div className={cx("flex flex-col gap-4 text-[17px] leading-relaxed", className)}>
      {paragraphs(text).map((p, i) => (
        <p key={i} className="m-0">
          {p}
        </p>
      ))}
    </div>
  );
}

type VisitCardProps = {
  hours: string;
  directions?: string;
  delivery?: string;
  email?: string;
  className?: string;
};

/** Hours, phone and directions in one white card. */
export function VisitCard({ hours, directions, delivery, email, className }: VisitCardProps) {
  const open = isOpenNow(hours);
  return (
    <div className={cx("overflow-hidden rounded-md border border-line bg-white text-ink", className)}>
      <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <Heading as="h3" size="sm">
              Hours
            </Heading>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted">
              <OpenDot open={open} /> {open ? "Open now" : "Closed now"}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line">{hours}</p>
          {delivery ? <p className="mt-2 font-bold">{delivery}</p> : null}
          <a href={SITE.phoneHref} className="display mt-2 inline-flex items-center gap-2 text-[28px] text-ink">
            <PhoneIcon className="h-6 w-6" /> {SITE.phoneDisplay}
          </a>
          {email ? (
            <div className="mt-1 text-[15px]">
              <a href={`mailto:${email}`} className="font-semibold text-brand underline">
                {email}
              </a>
            </div>
          ) : null}
        </div>
        <div>
          <Heading as="h3" size="sm">
            Visit
          </Heading>
          <p className="mt-2">
            <strong>{SITE.address.street}</strong>
            <br />
            {SITE.address.city}, {SITE.address.state} {SITE.address.zip}
            {directions ? (
              <>
                <br />
                {directions}
              </>
            ) : null}
          </p>
          <ButtonLink href={SITE.mapsUrl} target="_blank" rel="noreferrer" variant="outline" className="mt-3 w-full sm:w-auto">
            Get directions
          </ButtonLink>
        </div>
      </div>
      <div className="bg-paper px-5 py-3 text-[14px] text-muted sm:px-6">{ADDRESS_LINE}</div>
    </div>
  );
}

type CallBlockProps = {
  title: string;
  text?: string;
  label?: string;
  tone?: "ink" | "paper" | "cream";
  children?: ReactNode;
  className?: string;
};

/** "Call to reserve · (660) 239-4444": two tidy lines on a phone, one line wider. */
export function CallLabel({ label }: { label: string }) {
  return (
    <span className="flex flex-col items-center leading-none sm:flex-row sm:gap-2">
      <span>{label}</span>
      <span className="hidden sm:inline" aria-hidden>
        ·
      </span>
      <span className="mt-1 sm:mt-0">{SITE.phoneDisplay}</span>
    </span>
  );
}

/** "Call us" with the number big enough to tap. */
export function CallBlock({ title, text, label = "Call", tone = "ink", children, className }: CallBlockProps) {
  const tones = { ink: "bg-ink text-white", paper: "bg-paper text-ink", cream: "bg-cream text-cream-ink" };
  return (
    <div className={cx("rounded-md p-5 sm:p-8", tones[tone], className)}>
      <Heading as="h2" size="md">
        {title}
      </Heading>
      {text ? <p className={cx("mt-3 text-[17px]", tone === "ink" ? "text-[#cfcfcf]" : "")}>{text}</p> : null}
      <ButtonLink href={SITE.phoneHref} className="display mt-5 min-h-14 w-full text-[22px] tracking-wide sm:w-auto sm:px-8">
        <PhoneIcon className="h-5 w-5 shrink-0" /> <CallLabel label={label} />
      </ButtonLink>
      {children}
    </div>
  );
}

/** Every photo of an item, first one large, the rest stacked below it. */
export function ImageStack({ keys, alt, fallback = "Photo coming", rounded = true }: { keys: string[]; alt: string; fallback?: string; rounded?: boolean }) {
  const [first, ...rest] = keys;
  const r = rounded ? "rounded-md" : "";
  return (
    <div className="flex flex-col gap-3">
      <MediaImage imageKey={first} alt={alt} className={cx("w-full object-cover", first ? "max-h-[70vh]" : "h-56", r)} loading="eager" fallback={fallback} />
      {rest.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((key, i) => (
            <MediaImage key={key} imageKey={key} alt={`${alt} (photo ${i + 2})`} className={cx("aspect-[4/3] w-full object-cover", r)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-12 items-center font-bold text-brand">
      ← {children}
    </Link>
  );
}

export function Pill({ children, active, href }: { children: ReactNode; active?: boolean; href?: string }) {
  const className = cx(
    "inline-flex min-h-10 shrink-0 items-center rounded-full px-4 py-2 text-[14px] font-semibold",
    active ? "bg-ink text-white" : "border border-[#d8d8d8] bg-white text-ink",
  );
  return href ? (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  ) : (
    <span className={className}>{children}</span>
  );
}

/** A simple heading + text lead-in used above sections on inner pages. */
export function SectionLead({ eyebrow, title, text, eyebrowClass }: { eyebrow?: string; title: string; text?: string; eyebrowClass?: string }) {
  return (
    <div>
      {eyebrow ? <Eyebrow className={eyebrowClass ?? "text-brand"}>{eyebrow}</Eyebrow> : null}
      <Heading size="md" className={eyebrow ? "mt-1" : undefined}>
        {title}
      </Heading>
      {text ? <p className="mt-2 max-w-[640px] text-[16px] opacity-90">{text}</p> : null}
    </div>
  );
}
