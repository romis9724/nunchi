/**
 * Unit tests for sendWaitlistConfirmationEmail — Sub-AC 8b
 *
 * Verifies:
 *   1. On success, the function resolves without throwing.
 *   2. The correct recipient email is passed to Resend.
 *   3. The `from`, `subject`, and `html` fields are present in the payload.
 *   4. When the Resend API returns an error object, the function throws an Error
 *      whose message contains 'waitlist confirmation email failed'.
 *
 * A mock Resend client is injected via the optional `resend` parameter so that
 * no real HTTP calls are made.
 *
 * Run: tsx --test regression/waitlist_email.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sendWaitlistConfirmationEmail,
  type ResendClient,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Mock factory
// ---------------------------------------------------------------------------

interface CapturedPayload {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

function createMockResend(
  returnError: { message: string } | null = null
): { resend: ResendClient; calls: CapturedPayload[] } {
  const calls: CapturedPayload[] = [];

  const resend: ResendClient = {
    emails: {
      async send(payload: CapturedPayload) {
        calls.push({ ...payload });
        return { data: returnError ? null : { id: "mock-email-id" }, error: returnError };
      },
    },
  };

  return { resend, calls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("sendWaitlistConfirmationEmail — Sub-AC 8b", () => {
  it("resolves without throwing when Resend returns a successful response", async () => {
    // Arrange
    const { resend } = createMockResend();

    // Act & Assert — should not throw
    await assert.doesNotReject(
      () => sendWaitlistConfirmationEmail("user@example.com", resend),
      "must resolve when Resend returns no error"
    );
  });

  it("passes the provided email as the sole recipient", async () => {
    // Arrange
    const { resend, calls } = createMockResend();

    // Act
    await sendWaitlistConfirmationEmail("recipient@example.com", resend);

    // Assert
    assert.equal(calls.length, 1, "Resend.emails.send must be called exactly once");
    assert.deepEqual(
      calls[0].to,
      ["recipient@example.com"],
      "the 'to' field must contain exactly the provided email"
    );
  });

  it("sends from the Nunchi sender address", async () => {
    // Arrange
    const { resend, calls } = createMockResend();

    // Act
    await sendWaitlistConfirmationEmail("user@example.com", resend);

    // Assert
    assert.ok(
      typeof calls[0].from === "string" && calls[0].from.length > 0,
      "'from' must be a non-empty string"
    );
    assert.ok(
      calls[0].from.toLowerCase().includes("nunchi"),
      `'from' must reference 'Nunchi', got: ${calls[0].from}`
    );
  });

  it("includes a non-empty subject and html body", async () => {
    // Arrange
    const { resend, calls } = createMockResend();

    // Act
    await sendWaitlistConfirmationEmail("user@example.com", resend);

    // Assert
    assert.ok(
      typeof calls[0].subject === "string" && calls[0].subject.length > 0,
      "'subject' must be a non-empty string"
    );
    assert.ok(
      typeof calls[0].html === "string" && calls[0].html.length > 0,
      "'html' must be a non-empty string"
    );
  });

  it("throws an Error containing 'waitlist confirmation email failed' when the API returns an error", async () => {
    // Arrange
    const { resend } = createMockResend({ message: "invalid_api_key" });

    // Act & Assert
    await assert.rejects(
      () => sendWaitlistConfirmationEmail("user@example.com", resend),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error");
        assert.ok(
          err.message.includes("waitlist confirmation email failed"),
          `Expected message to contain 'waitlist confirmation email failed', got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("propagates the original Resend error message in the thrown Error", async () => {
    // Arrange
    const { resend } = createMockResend({ message: "rate_limit_exceeded" });

    // Act & Assert
    await assert.rejects(
      () => sendWaitlistConfirmationEmail("fail@example.com", resend),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(
          err.message.includes("rate_limit_exceeded"),
          `Thrown message must contain the Resend error message 'rate_limit_exceeded', got: ${err.message}`
        );
        return true;
      }
    );
  });
});
