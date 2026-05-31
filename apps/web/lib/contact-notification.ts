/**
 * sendContactNotification — admin email alert for new /contact inquiries.
 *
 * When a visitor submits the /contact form and the inquiry row is successfully
 * inserted into Supabase, this function is called to notify the Noonchi admin
 * team via Resend so they can follow up promptly.
 *
 * Design decisions:
 *  - The Resend client is injected via an optional parameter so unit tests can
 *    pass a mock without importing the `resend` package.
 *  - At runtime (no mock injected) the real Resend client is lazily imported to
 *    avoid loading the package in test environments.
 *  - The admin recipient is read from ADMIN_EMAIL env var; a compile-time
 *    fallback keeps the function safe when the variable is absent.
 *  - Throws an Error when Resend returns an error object so callers can handle
 *    delivery failures explicitly.
 */

import type { InquiryRow } from "./inquiries.js";

// ── Structural interfaces (injectable in tests) ──────────────────────────────

/**
 * Minimal structural interface for the Resend `emails` sub-client.
 * Defined locally so test environments can inject a mock without importing
 * the `resend` package.
 */
export interface ResendEmailsSendClient {
  send(payload: {
    from: string;
    to: string[];
    subject: string;
    html: string;
  }): Promise<{
    data: { id: string } | null;
    error: { message: string } | null;
  }>;
}

/**
 * Minimal structural interface for the Resend client injected via tests.
 */
export interface ResendClient {
  emails: ResendEmailsSendClient;
}

// ── sendContactNotification ──────────────────────────────────────────────────

/**
 * Sends an admin notification email when a new inquiry is received via
 * the /contact form.
 *
 * Throws an `Error` when the Resend API returns an error response so that
 * callers can handle delivery failures explicitly.
 *
 * @param inquiry  The inserted `InquiryRow` returned by `submitInquiry`.
 * @param resend   Optional Resend client (injected in tests). Defaults to a
 *                 real `Resend` instance via a lazy import so that the package
 *                 is never loaded when a mock is provided.
 */
export async function sendContactNotification(
  inquiry: InquiryRow,
  resend?: ResendClient
): Promise<void> {
  let client: ResendClient;

  if (resend) {
    client = resend;
  } else {
    // Lazy import: `resend` is only resolved at runtime when no mock is given.
    const { Resend } = await import("resend");
    client = new Resend(
      process.env.RESEND_API_KEY
    ) as unknown as ResendClient;
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@noonchi.so";

  const html = [
    "<h2>새로운 문의가 도착했습니다</h2>",
    `<p><strong>이름:</strong> ${inquiry.name}</p>`,
    `<p><strong>이메일:</strong> ${inquiry.email}</p>`,
    `<p><strong>메시지:</strong></p>`,
    `<blockquote>${inquiry.message.replace(/\n/g, "<br/>")}</blockquote>`,
    inquiry.user_id
      ? `<p><strong>사용자 ID:</strong> ${inquiry.user_id}</p>`
      : "",
    `<p><strong>접수 시각:</strong> ${inquiry.created_at}</p>`,
    `<p><strong>문의 ID:</strong> ${inquiry.id}</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  const { error } = await client.emails.send({
    from: "noonch-i 알림 <noreply@noonchi.so>",
    to: [adminEmail],
    subject: `[noonch-i] 새 문의: ${inquiry.name}`,
    html,
  });

  if (error) {
    throw new Error(
      `sendContactNotification: Resend error — ${error.message}`
    );
  }
}
