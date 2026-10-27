"use client";

import { useState } from "react";

import { SubmitButton } from "@/components/admin/SubmitButton";
import { Field, Input, Textarea, cx } from "@/components/ui";

type Props = {
  promotionId: string;
  action: (formData: FormData) => Promise<void>;
  preview: { sms: number; email: number; smsConfigured: boolean; emailConfigured: boolean };
  smsDraft: string;
  emailSubjectDraft: string;
};

const SMS_SEGMENT = 160;

/**
 * The "Send alert" box on a published promotion: edit the text, pick the
 * channels, see how many people it reaches before tapping send.
 */
export function SendAlertForm({ promotionId, action, preview, smsDraft, emailSubjectDraft }: Props) {
  const smsPossible = preview.smsConfigured && preview.sms > 0;
  const emailPossible = preview.emailConfigured && preview.email > 0;
  const [sendSms, setSendSms] = useState(smsPossible);
  const [sendEmail, setSendEmail] = useState(emailPossible);
  const [smsText, setSmsText] = useState(smsDraft);
  const total = (sendSms ? preview.sms : 0) + (sendEmail ? preview.email : 0);
  const over = smsText.length > SMS_SEGMENT;

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="promotionId" value={promotionId} />

      <label className={cx("flex min-h-12 items-start gap-3 rounded border border-line px-3 py-2.5", !smsPossible && "opacity-60")}>
        <input type="checkbox" name="sendSms" checked={sendSms} disabled={!smsPossible} onChange={(e) => setSendSms(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
        <span className="text-[15px] font-semibold leading-snug">
          Send texts to {preview.sms} {preview.sms === 1 ? "person" : "people"}
          {!preview.smsConfigured ? <span className="block text-[13px] font-medium text-muted">Texting isn&apos;t set up yet (Twilio keys missing).</span> : null}
          {preview.smsConfigured && preview.sms === 0 ? <span className="block text-[13px] font-medium text-muted">Nobody has confirmed texts yet.</span> : null}
        </span>
      </label>

      {sendSms ? (
        <Field label="Text message" hint={`${smsText.length}/${SMS_SEGMENT} characters${over ? " · over 160 sends as 2 texts" : ""}`}>
          <Textarea name="smsText" rows={4} value={smsText} onChange={(e) => setSmsText(e.target.value)} maxLength={320} className={over ? "border-brand" : undefined} />
        </Field>
      ) : null}

      <label className={cx("flex min-h-12 items-start gap-3 rounded border border-line px-3 py-2.5", !emailPossible && "opacity-60")}>
        <input type="checkbox" name="sendEmail" checked={sendEmail} disabled={!emailPossible} onChange={(e) => setSendEmail(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
        <span className="text-[15px] font-semibold leading-snug">
          Send emails to {preview.email} {preview.email === 1 ? "person" : "people"}
          {!preview.emailConfigured ? <span className="block text-[13px] font-medium text-muted">Email isn&apos;t set up yet (Resend keys missing).</span> : null}
          {preview.emailConfigured && preview.email === 0 ? <span className="block text-[13px] font-medium text-muted">Nobody has confirmed email yet.</span> : null}
        </span>
      </label>

      {sendEmail ? (
        <Field label="Email subject">
          <Input name="emailSubject" defaultValue={emailSubjectDraft} maxLength={120} required />
        </Field>
      ) : null}

      <SubmitButton full disabled={total === 0} pendingText="Queuing…" className="h-14 text-[18px]">
        {total === 0 ? "Pick a channel to send" : `Send to ${total} ${total === 1 ? "person" : "people"}`}
      </SubmitButton>
      <p className="m-0 text-[13px] text-muted">Messages go out right after you tap send. There is no undo.</p>
    </form>
  );
}
