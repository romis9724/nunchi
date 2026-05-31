/**
 * Unit tests for sendContactNotification — Sub-AC 17.3
 *
 * Verifies that sendContactNotification:
 *  1. Calls client.emails.send() exactly once for a given InquiryRow.
 *  2. Sends to the ADMIN_EMAIL env var address (or the default fallback).
 *  3. Uses "Nunchi 알림 <noreply@nunchi.so>" as the `from` address.
 *  4. Includes the inquiry name in the email subject.
 *  5. Includes the inquiry name, email, and message in the HTML body.
 *  6. Includes the inquiry id in the HTML body.
 *  7. Includes user_id in the body when it is present.
 *  8. Omits the user_id line when user_id is null.
 *  9. Throws an Error when Resend returns an error object.
 * 10. The Error message includes "sendContactNotification" for traceability.
 * 11. The Error message forwards the original Resend error message.
 *
 * Strategy: inject a mock Resend client — no real network, no Resend package.
 *
 * Run: tsx --test regression/send_contact_notification.test.ts
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

import {
  sendContactNotification,
  type ResendClient,
  type ResendEmailsSendClient,
} from "../../apps/web/lib/contact-notification.js";
import type { InquiryRow } from "../../apps/web/lib/inquiries.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

interface CapturedSend {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

function createMockResendClient(
  returnError: { message: string } | null = null
): { client: ResendClient; calls: CapturedSend[] } {
  const calls: CapturedSend[] = [];

  const emailsSendClient: ResendEmailsSendClient = {
    send(payload) {
      calls.push({ ...payload });
      return Promise.resolve({
        data: returnError ? null : { id: "mock-email-id" },
        error: returnError,
      });
    },
  };

  const client: ResendClient = {
    emails: emailsSendClient,
  };

  return { client, calls };
}

function makeInquiryRow(overrides: Partial<InquiryRow> = {}): InquiryRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "홍길동",
    email: "hong@example.com",
    message: "테스트 문의 메시지입니다.",
    user_id: null,
    created_at: "2026-05-28T10:00:00.000Z",
    ...overrides,
  };
}

// ── Env var setup for admin email tests ──────────────────────────────────────

describe("sendContactNotification — Resend API call", () => {
  it("calls client.emails.send() exactly once", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow();

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.strictEqual(calls.length, 1, "emails.send() must be called exactly once");
  });

  it("sends from 'Nunchi 알림 <noreply@nunchi.so>'", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();

    // Act
    await sendContactNotification(makeInquiryRow(), client);

    // Assert
    assert.strictEqual(
      calls[0].from,
      "Nunchi 알림 <noreply@nunchi.so>",
      "from address must be 'Nunchi 알림 <noreply@nunchi.so>'"
    );
  });

  it("sends to the ADMIN_EMAIL env var when set", async () => {
    // Arrange
    const original = process.env.ADMIN_EMAIL;
    process.env.ADMIN_EMAIL = "custom-admin@nunchi.so";
    const { client, calls } = createMockResendClient();

    try {
      // Act
      await sendContactNotification(makeInquiryRow(), client);

      // Assert
      assert.ok(
        calls[0].to.includes("custom-admin@nunchi.so"),
        "must send to ADMIN_EMAIL env var when set"
      );
    } finally {
      // Restore
      if (original === undefined) {
        delete process.env.ADMIN_EMAIL;
      } else {
        process.env.ADMIN_EMAIL = original;
      }
    }
  });

  it("falls back to 'admin@nunchi.so' when ADMIN_EMAIL is not set", async () => {
    // Arrange
    const original = process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_EMAIL;
    const { client, calls } = createMockResendClient();

    try {
      // Act
      await sendContactNotification(makeInquiryRow(), client);

      // Assert
      assert.ok(
        calls[0].to.includes("admin@nunchi.so"),
        "must fall back to 'admin@nunchi.so' when ADMIN_EMAIL is not set"
      );
    } finally {
      // Restore
      if (original !== undefined) {
        process.env.ADMIN_EMAIL = original;
      }
    }
  });

  it("includes the inquiry name in the subject line", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({ name: "김철수" });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].subject.includes("김철수"),
      `subject must include the inquiry name '김철수', got: ${calls[0].subject}`
    );
  });

  it("includes the inquiry name in the HTML body", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({ name: "박지수" });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].html.includes("박지수"),
      "HTML body must include the inquiry name"
    );
  });

  it("includes the inquiry email in the HTML body", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({ email: "jisoo@example.com" });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].html.includes("jisoo@example.com"),
      "HTML body must include the inquiry email address"
    );
  });

  it("includes the inquiry message in the HTML body", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({ message: "고유한 문의 내용입니다." });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].html.includes("고유한 문의 내용입니다."),
      "HTML body must include the inquiry message"
    );
  });

  it("includes the inquiry id in the HTML body", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].html.includes("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
      "HTML body must include the inquiry id"
    );
  });

  it("includes user_id in the HTML body when it is non-null", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({
      user_id: "user-uuid-999",
    });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      calls[0].html.includes("user-uuid-999"),
      "HTML body must include user_id when non-null"
    );
  });

  it("omits user_id from the HTML body when user_id is null", async () => {
    // Arrange
    const { client, calls } = createMockResendClient();
    const inquiry = makeInquiryRow({ user_id: null });

    // Act
    await sendContactNotification(inquiry, client);

    // Assert
    assert.ok(
      !calls[0].html.includes("사용자 ID"),
      "HTML body must NOT include 사용자 ID block when user_id is null"
    );
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe("sendContactNotification — Resend error handling", () => {
  it("throws an Error when Resend returns an error object", async () => {
    // Arrange
    const { client } = createMockResendClient({ message: "invalid_api_key" });

    // Act & Assert
    await assert.rejects(
      () => sendContactNotification(makeInquiryRow(), client),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error instance");
        return true;
      }
    );
  });

  it("error message includes 'sendContactNotification' for traceability", async () => {
    // Arrange
    const { client } = createMockResendClient({ message: "rate_limit_exceeded" });

    // Act & Assert
    await assert.rejects(
      () => sendContactNotification(makeInquiryRow(), client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("sendContactNotification"),
          `Error message must include 'sendContactNotification', got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("error message forwards the original Resend error message", async () => {
    // Arrange
    const { client } = createMockResendClient({
      message: "domain_not_verified",
    });

    // Act & Assert
    await assert.rejects(
      () => sendContactNotification(makeInquiryRow(), client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("domain_not_verified"),
          `Error message must forward original Resend error, got: ${err.message}`
        );
        return true;
      }
    );
  });
});
