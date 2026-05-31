/**
 * Contact / inquiry form configuration for the /contact page.
 *
 * Pure data module — no DOM, no React, no side effects.
 * Safe to import in any environment and unit-testable without a browser.
 *
 * The /contact route is PUBLICLY accessible: it requires no authentication.
 * Any visitor (authenticated or anonymous) can submit an inquiry.
 */

// ── Field descriptor ────────────────────────────────────────────────────────

export interface ContactField {
  /** HTML input `name` attribute */
  name: string;
  /** Input type: "text", "email", or "textarea" for multi-line input */
  type: "text" | "email" | "textarea";
  /** Human-readable label displayed next to the field (Korean) */
  label: string;
  /** Whether the field is required for form submission */
  required: boolean;
}

// ── Form fields ─────────────────────────────────────────────────────────────

/**
 * The three required fields for the contact/inquiry form.
 *
 * Ordered as they appear in the rendered form:
 *  1. 이름 (name) — text
 *  2. 이메일 (email) — email
 *  3. 메시지 (message) — textarea
 */
export const CONTACT_FORM_FIELDS: readonly ContactField[] = [
  {
    name: "name",
    type: "text",
    label: "이름",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "이메일",
    required: true,
  },
  {
    name: "message",
    type: "textarea",
    label: "메시지",
    required: true,
  },
] as const;

// ── Route metadata ───────────────────────────────────────────────────────────

/** Route path for the contact/inquiry page. */
export const CONTACT_ROUTE = "/contact" as const;

/**
 * Access control: the /contact page does NOT require authentication.
 *
 * This constant is the single authoritative source of truth for the access
 * policy of the contact page. Route middleware and any auth-guard logic must
 * be consistent with this value.
 *
 * `false` → publicly accessible (no login required).
 */
export const CONTACT_REQUIRES_AUTH = false as const;
