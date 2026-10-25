// Shared admin form state (safe for client and server).
import type { Field } from "./rsvp";
import type { InviteInput } from "./records";

interface FormState<E extends string> {
  status: "idle" | "invalid" | "saved" | "error";
  errors: Partial<Record<E, string>>;
  message?: string;
  /** Changes on every attempt so editors can react once per result. */
  at: number;
}

export type AdminFormState = FormState<Field>;
export type InviteFormState = FormState<keyof InviteInput>;
/** Errors are keyed by the item path, e.g. "2.title"; "_" is the whole list. */
export type ContentFormState = FormState<string>;

export const initialAdminState: AdminFormState = { status: "idle", errors: {}, at: 0 };
export const initialInviteState: InviteFormState = { status: "idle", errors: {}, at: 0 };
export const initialContentState: ContentFormState = { status: "idle", errors: {}, at: 0 };

export interface LoginState {
  error?: string;
}
