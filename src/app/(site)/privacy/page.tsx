import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow, Heading, Section } from "@/components/ui";
import { getContent } from "@/lib/content";
import { ADDRESS_LINE, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What West Building Center collects on this site, how we use it, who we share it with, and how to stop deal alerts.",
};

const EFFECTIVE = "October 27, 2026";

function H({ children }: { children: React.ReactNode }) {
  return (
    <Heading as="h2" size="sm" className="mt-8">
      {children}
    </Heading>
  );
}

export default async function PrivacyPage() {
  const content = await getContent();
  const email = content["store.email"].trim();
  return (
    <Section>
      <article className="mx-auto max-w-[720px] text-[17px] leading-relaxed [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
        <Eyebrow className="text-brand">Privacy</Eyebrow>
        <Heading as="h1" size="lg" className="mt-2">
          Privacy policy
        </Heading>
        <p className="text-muted">Effective {EFFECTIVE}. This covers westbuildingcenter.com and our deal-alert texts and emails.</p>
        <p>
          We&apos;re a family-owned lumber yard, not a data company. We collect the least we can, use it only to do what you asked, and never sell it. Here&apos;s the plain version.
        </p>

        <H>What we collect</H>
        <ul>
          <li>
            <strong>When you sign up for deal alerts:</strong> your name (if you give it), mobile number and/or email, the date and wording you agreed to, and whether you confirmed (YES by text or the link in the email).
          </li>
          <li>
            <strong>When you send a form:</strong> whatever you type (name, company, phone, email, your message or parts list, project details) and any files you attach, like plans or photos.
          </li>
          <li>
            <strong>Automatically:</strong> standard server logs (IP address, browser, pages requested, time). We use them to keep the site running and to stop spam. We don&apos;t run advertising trackers.
          </li>
        </ul>

        <H>How we use it</H>
        <ul>
          <li>To send the deal alerts you asked for, about 2–4 a month, by the channels you chose.</li>
          <li>To answer your question, quote your list, build your materials estimate, or set up your account.</li>
          <li>To show a project photo you sent us in the gallery (we show the photo and a caption, never your contact info).</li>
          <li>To keep the site working and keep bots out.</li>
        </ul>

        <H>Who we share it with</H>
        <p>
          <strong>We never sell or rent phone numbers, emails or anything else, and we don&apos;t share them with other businesses for their marketing.</strong> No mobile information is shared with third parties or affiliates for marketing or promotional purposes.
        </p>
        <p>The only companies that touch your data are the ones that deliver the service for us:</p>
        <ul>
          <li>
            <strong>Twilio</strong> sends and receives our text messages.
          </li>
          <li>
            <strong>Resend</strong> sends our emails.
          </li>
          <li>
            <strong>Railway</strong> hosts the website, database and uploaded files.
          </li>
        </ul>
        <p>Each of them is bound to use the data only to provide that service. We&apos;d also disclose information if the law required it.</p>

        <H>How to stop</H>
        <ul>
          <li>
            <strong>Texts:</strong> reply <strong>STOP</strong> to any message. Reply <strong>HELP</strong> for help.
          </li>
          <li>
            <strong>Emails:</strong> click the unsubscribe link at the bottom of any email, or use the manage link in it.
          </li>
          <li>
            <strong>Anything else:</strong> call {SITE.phoneDisplay} or email us and we&apos;ll remove you by hand, and delete your form submissions if you ask.
          </li>
        </ul>
        <p>
          You can also stop alerts from{" "}
          <Link href="/alerts/manage" className="font-semibold text-brand underline">
            the manage page
          </Link>
          . When you stop, we keep your number or email on an opt-out list so we don&apos;t accidentally text you again.
        </p>

        <H>Keeping it safe</H>
        <p>The site runs over HTTPS, the admin area needs a Google sign-in from an approved address, and uploads are stored privately. No system is perfect, but we keep the circle small.</p>

        <H>Kids</H>
        <p>The site and alerts are for adults. We don&apos;t knowingly collect information from anyone under 13.</p>

        <H>Changes</H>
        <p>If we change this policy we&apos;ll update the date at the top. Big changes, we&apos;ll say so in an alert.</p>

        <H>Contact</H>
        <p>
          {SITE.name}
          <br />
          {ADDRESS_LINE}
          <br />
          <a href={SITE.phoneHref} className="font-semibold text-brand underline">
            {SITE.phoneDisplay}
          </a>
          {email ? (
            <>
              <br />
              <a href={`mailto:${email}`} className="font-semibold text-brand underline">
                {email}
              </a>
            </>
          ) : null}
        </p>
        <p className="text-[15px] text-muted">
          See also our{" "}
          <Link href="/sms-terms" className="underline">
            SMS terms
          </Link>
          .
        </p>
      </article>
    </Section>
  );
}
