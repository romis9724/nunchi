/**
 * Unit tests for submitInquiry — Sub-AC 17.2
 *
 * Verifies:
 *  1. A valid input causes a single insert call to the Supabase `inquiries` table.
 *  2. The function returns the row returned by the mocked Supabase client.
 *  3. The name, email, and message fields in the insert payload match the input.
 *  4. submitInquiry throws an Error when Supabase returns an error object.
 *  5. submitInquiry throws an Error when Supabase returns data: null (no row).
 *  6. submitInquiry throws when name is blank / whitespace-only.
 *  7. submitInquiry throws when email is blank / whitespace-only.
 *  8. submitInquiry throws when message is blank / whitespace-only.
 *  9. Leading/trailing whitespace in fields is trimmed before inserting.
 * 10. Optional user_id is forwarded when provided.
 * 11. user_id is omitted from the insert payload when not provided.
 *
 * Strategy: inject a mock Supabase client — no real network, no database.
 *
 * Run: tsx --test regression/submit_inquiry.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  submitInquiry,
  type InquiryInsertClient,
  type InquiryRow,
  type InquiryInput,
} from "../../apps/web/lib/inquiries.js";

// ── Mock factory ──────────────────────────────────────────────────────────────

interface MockInsertCall {
  table: string;
  payload: Record<string, unknown>;
}

function createMockClient(
  returnRow: InquiryRow | null = null,
  returnError: { message: string } | null = null
): { client: InquiryInsertClient; calls: MockInsertCall[] } {
  const calls: MockInsertCall[] = [];

  const client: InquiryInsertClient = {
    from(table: "inquiries") {
      return {
        insert(data: InquiryInput) {
          calls.push({ table, payload: data as unknown as Record<string, unknown> });
          return {
            select() {
              return {
                single() {
                  return Promise.resolve({
                    data: returnRow,
                    error: returnError,
                  });
                },
              };
            },
          };
        },
      };
    },
  };

  return { client, calls };
}

function makeRow(overrides: Partial<InquiryRow> = {}): InquiryRow {
  return {
    id: "00000000-0000-0000-0000-000000000001",
    name: "홍길동",
    email: "hong@example.com",
    message: "테스트 문의입니다.",
    user_id: null,
    created_at: "2026-05-28T00:00:00.000Z",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("submitInquiry — happy path", () => {
  it("calls from('inquiries').insert().select().single() exactly once", async () => {
    // Arrange
    const row = makeRow();
    const { client, calls } = createMockClient(row);
    const input: InquiryInput = {
      name: "홍길동",
      email: "hong@example.com",
      message: "테스트 문의입니다.",
    };

    // Act
    await submitInquiry(input, client);

    // Assert
    assert.strictEqual(calls.length, 1, "insert must be called exactly once");
    assert.strictEqual(calls[0].table, "inquiries", "must insert into 'inquiries' table");
  });

  it("returns the row returned by the Supabase client", async () => {
    // Arrange
    const expectedRow = makeRow({ id: "abc-123" });
    const { client } = createMockClient(expectedRow);

    // Act
    const result = await submitInquiry(
      { name: "홍길동", email: "hong@example.com", message: "문의" },
      client
    );

    // Assert
    assert.deepStrictEqual(result, expectedRow, "must return the row from Supabase");
  });

  it("forwards name, email, and message in the insert payload", async () => {
    // Arrange
    const { client, calls } = createMockClient(makeRow());

    // Act
    await submitInquiry(
      { name: "테스터", email: "test@noonchi.so", message: "안녕하세요" },
      client
    );

    // Assert
    const payload = calls[0].payload;
    assert.strictEqual(payload["name"], "테스터", "name must be forwarded to insert");
    assert.strictEqual(payload["email"], "test@noonchi.so", "email must be forwarded to insert");
    assert.strictEqual(payload["message"], "안녕하세요", "message must be forwarded to insert");
  });

  it("includes user_id in the insert payload when provided", async () => {
    // Arrange
    const userId = "user-uuid-001";
    const { client, calls } = createMockClient(makeRow({ user_id: userId }));

    // Act
    await submitInquiry(
      {
        name: "홍길동",
        email: "hong@example.com",
        message: "유저 문의",
        user_id: userId,
      },
      client
    );

    // Assert
    assert.strictEqual(
      calls[0].payload["user_id"],
      userId,
      "user_id must be forwarded when provided"
    );
  });

  it("omits user_id from the insert payload when not provided", async () => {
    // Arrange
    const { client, calls } = createMockClient(makeRow());

    // Act
    await submitInquiry(
      { name: "홍길동", email: "hong@example.com", message: "익명 문의" },
      client
    );

    // Assert
    assert.ok(
      !("user_id" in calls[0].payload),
      "user_id must NOT be present in payload when not provided by caller"
    );
  });

  it("trims leading/trailing whitespace from name, email, and message", async () => {
    // Arrange
    const { client, calls } = createMockClient(makeRow());

    // Act
    await submitInquiry(
      {
        name: "  홍길동  ",
        email: "  hong@example.com  ",
        message: "  문의 내용  ",
      },
      client
    );

    // Assert
    const payload = calls[0].payload;
    assert.strictEqual(payload["name"], "홍길동", "name must be trimmed");
    assert.strictEqual(payload["email"], "hong@example.com", "email must be trimmed");
    assert.strictEqual(payload["message"], "문의 내용", "message must be trimmed");
  });
});

describe("submitInquiry — Supabase error handling", () => {
  it("throws an Error when Supabase returns an error object", async () => {
    // Arrange
    const { client } = createMockClient(null, { message: "duplicate key value" });

    // Act & Assert
    await assert.rejects(
      () =>
        submitInquiry(
          { name: "홍길동", email: "hong@example.com", message: "문의" },
          client
        ),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error instance");
        assert.ok(
          err.message.includes("submitInquiry"),
          `Error message must include 'submitInquiry', got: ${err.message}`
        );
        assert.ok(
          err.message.includes("duplicate key value"),
          `Error message must include original Supabase error, got: ${err.message}`
        );
        return true;
      }
    );
  });

  it("throws an Error when Supabase returns data: null with no error", async () => {
    // Arrange — row is null but no error (edge case from Supabase)
    const { client } = createMockClient(null, null);

    // Act & Assert
    await assert.rejects(
      () =>
        submitInquiry(
          { name: "홍길동", email: "hong@example.com", message: "문의" },
          client
        ),
      (err: unknown) => {
        assert.ok(err instanceof Error, "thrown value must be an Error instance");
        assert.ok(
          err.message.includes("no row was returned"),
          `Expected 'no row was returned' in message, got: ${err.message}`
        );
        return true;
      }
    );
  });
});

describe("submitInquiry — input validation", () => {
  it("throws when name is an empty string", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () => submitInquiry({ name: "", email: "e@e.com", message: "msg" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("name is required"));
        return true;
      }
    );
  });

  it("throws when name is whitespace-only", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () => submitInquiry({ name: "   ", email: "e@e.com", message: "msg" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("name is required"));
        return true;
      }
    );
  });

  it("throws when email is an empty string", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () => submitInquiry({ name: "홍길동", email: "", message: "msg" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("email is required"));
        return true;
      }
    );
  });

  it("throws when email is whitespace-only", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () => submitInquiry({ name: "홍길동", email: "  ", message: "msg" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("email is required"));
        return true;
      }
    );
  });

  it("throws when message is an empty string", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () => submitInquiry({ name: "홍길동", email: "e@e.com", message: "" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("message is required"));
        return true;
      }
    );
  });

  it("throws when message is whitespace-only", async () => {
    // Arrange
    const { client } = createMockClient(makeRow());

    // Act & Assert
    await assert.rejects(
      () =>
        submitInquiry({ name: "홍길동", email: "e@e.com", message: "\t\n" }, client),
      (err: unknown) => {
        assert.ok(err instanceof Error);
        assert.ok(err.message.includes("message is required"));
        return true;
      }
    );
  });
});
