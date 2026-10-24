// Shared admin form state (safe for client and server).
import type { Field } from "./rsvp";

export interface AdminFormState {
  status: "idle" | "invalid" | "saved" | "error";
  errors: Partial<Record<Field, string>>;
  message?: string;
  /** Changes on every attempt so editors can react once per result. */
  at: number;
}

export const initialAdminState: AdminFormState = { status: "idle", errors: {}, at: 0 };

export interface LoginState {
  error?: string;
}
