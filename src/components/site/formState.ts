/** Shared result shape for the public forms (client-safe: no server imports). */
export type FormState = {
  status: "idle" | "ok" | "error";
  message?: string;
  /** Field name → message, for the fields zod rejected. */
  errors?: Record<string, string>;
};

export const initialFormState: FormState = { status: "idle" };

export const GENERIC_FORM_ERROR = "Something went wrong on our end. Give us a call and we'll take it over the phone.";
