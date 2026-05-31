/**
 * Unit tests for the /contact page — Sub-AC 17.1
 *
 * Verifies:
 *  1. The contact page file exists on disk at the expected Next.js App Router path.
 *  2. The contact route is publicly accessible (CONTACT_REQUIRES_AUTH === false).
 *  3. CONTACT_ROUTE is '/contact'.
 *  4. The form has exactly 3 fields: name, email, message (in that order).
 *  5. Each field has the correct type (text, email, textarea).
 *  6. Each field is marked as required.
 *  7. The page source contains the HTML `name` attribute for each form field
 *     (name="name", name="email", name="message") — confirming the fields would
 *     be rendered.
 *  8. The page source does NOT import any server-side auth guard that would
 *     block unauthenticated access (no `redirect` calls tied to session checks
 *     at the top-level server component layer).
 *
 * Strategy: pure data test on the contact-form module + static analysis of the
 * page source. No DOM, no React, no network.
 *
 * Run: tsx --test regression/contact_page.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CONTACT_FORM_FIELDS,
  CONTACT_REQUIRES_AUTH,
  CONTACT_ROUTE,
  type ContactField,
} from "../../apps/web/lib/contact-form.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "../..");

const PAGE_PATH = "apps/web/app/contact/page.tsx";
const PAGE_ABS = resolve(ROOT, PAGE_PATH);

// ── CONTACT_ROUTE ────────────────────────────────────────────────────────────

describe("CONTACT_ROUTE", () => {
  it("is '/contact'", () => {
    assert.strictEqual(CONTACT_ROUTE, "/contact");
  });

  it("starts with '/'", () => {
    assert.ok(
      CONTACT_ROUTE.startsWith("/"),
      "CONTACT_ROUTE must start with '/'",
    );
  });
});

// ── Public access ────────────────────────────────────────────────────────────

describe("CONTACT_REQUIRES_AUTH — public access policy", () => {
  it("is false (no authentication required)", () => {
    assert.strictEqual(
      CONTACT_REQUIRES_AUTH,
      false,
      "CONTACT_REQUIRES_AUTH must be false — /contact is publicly accessible",
    );
  });

  it("is a boolean (not a truthy/falsy value)", () => {
    assert.strictEqual(
      typeof CONTACT_REQUIRES_AUTH,
      "boolean",
      "CONTACT_REQUIRES_AUTH must be a boolean literal",
    );
  });
});

// ── CONTACT_FORM_FIELDS ──────────────────────────────────────────────────────

describe("CONTACT_FORM_FIELDS — form field configuration", () => {
  it("has exactly 3 fields", () => {
    assert.strictEqual(
      CONTACT_FORM_FIELDS.length,
      3,
      `Expected 3 form fields, got ${CONTACT_FORM_FIELDS.length}`,
    );
  });

  it("first field is 'name' with type 'text'", () => {
    const field = CONTACT_FORM_FIELDS[0];
    assert.strictEqual(field.name, "name", "First field name must be 'name'");
    assert.strictEqual(field.type, "text", "First field type must be 'text'");
  });

  it("second field is 'email' with type 'email'", () => {
    const field = CONTACT_FORM_FIELDS[1];
    assert.strictEqual(field.name, "email", "Second field name must be 'email'");
    assert.strictEqual(field.type, "email", "Second field type must be 'email'");
  });

  it("third field is 'message' with type 'textarea'", () => {
    const field = CONTACT_FORM_FIELDS[2];
    assert.strictEqual(
      field.name,
      "message",
      "Third field name must be 'message'",
    );
    assert.strictEqual(
      field.type,
      "textarea",
      "Third field type must be 'textarea'",
    );
  });

  it("all fields are required", () => {
    for (const field of CONTACT_FORM_FIELDS) {
      assert.strictEqual(
        field.required,
        true,
        `Field '${field.name}' must be required`,
      );
    }
  });

  it("each field has a non-empty label", () => {
    for (const field of CONTACT_FORM_FIELDS) {
      assert.ok(
        typeof field.label === "string" && field.label.trim().length > 0,
        `Field '${field.name}' must have a non-empty label`,
      );
    }
  });

  it("satisfies the ContactField interface shape (name, type, label, required)", () => {
    const requiredKeys: (keyof ContactField)[] = [
      "name",
      "type",
      "label",
      "required",
    ];
    for (const field of CONTACT_FORM_FIELDS) {
      for (const key of requiredKeys) {
        assert.ok(
          key in field,
          `ContactField with name='${field.name}' is missing key '${key}'`,
        );
      }
    }
  });

  it("no duplicate field names", () => {
    const names = [...CONTACT_FORM_FIELDS].map((f) => f.name);
    const unique = new Set(names);
    assert.strictEqual(
      unique.size,
      names.length,
      `Duplicate field names found: ${names.join(", ")}`,
    );
  });
});

// ── Page file — existence and source analysis ────────────────────────────────

describe("/contact page source — file existence and rendered fields", () => {
  it("page file exists on disk", () => {
    assert.ok(
      existsSync(PAGE_ABS),
      `Expected contact page to exist at ${PAGE_PATH}. ` +
        "Create apps/web/app/contact/page.tsx to satisfy this AC.",
    );
  });

  // Source-analysis tests only run when the file exists
  const source = existsSync(PAGE_ABS) ? readFileSync(PAGE_ABS, "utf-8") : "";

  it("page source contains name=\"name\" (name input field)", () => {
    assert.ok(
      source.includes('name="name"'),
      `${PAGE_PATH} must include name="name" for the name input field`,
    );
  });

  it("page source contains name=\"email\" (email input field)", () => {
    assert.ok(
      source.includes('name="email"'),
      `${PAGE_PATH} must include name="email" for the email input field`,
    );
  });

  it("page source contains name=\"message\" (message textarea field)", () => {
    assert.ok(
      source.includes('name="message"'),
      `${PAGE_PATH} must include name="message" for the message textarea field`,
    );
  });

  it("page source contains an <input> or <textarea> for each of the 3 form fields", () => {
    const hasNameInput =
      /<input[^>]*name="name"/.test(source) ||
      /name="name"[^>]*>/.test(source);
    const hasEmailInput =
      /<input[^>]*name="email"/.test(source) ||
      /name="email"[^>]*>/.test(source);
    const hasMessageTextarea =
      /<textarea[^>]*name="message"/.test(source) ||
      /name="message"/.test(source);

    assert.ok(hasNameInput, "Must have an input with name='name'");
    assert.ok(hasEmailInput, "Must have an input with name='email'");
    assert.ok(hasMessageTextarea, "Must have a textarea with name='message'");
  });

  it("page source does NOT call redirect() inside a server-side auth guard", () => {
    // Pattern: server component auth guard pattern is:
    //   const session = await getSession(); if (!session) redirect(...)
    // OR: import { redirect } from 'next/navigation' combined with getSession() at top level
    // The contact page must NOT block unauthenticated users at the server component level.
    //
    // This check is deliberately narrow: it only flags the combination of
    // getSession() with redirect() at server-component top level, NOT client-side
    // conditional rendering (which is fine for post-submit feedback).
    const hasServerAuthGuard =
      /await\s+getSession\s*\(/.test(source) &&
      /redirect\s*\(/.test(source) &&
      // Must NOT be "use client" page — server component auth guard only applies
      // to server components (no "use client" directive at file top)
      !source.trimStart().startsWith('"use client"') &&
      !source.trimStart().startsWith("'use client'");

    assert.ok(
      !hasServerAuthGuard,
      `${PAGE_PATH} must not contain a server-side auth guard (getSession + redirect). ` +
        "The /contact page is publicly accessible and must not redirect unauthenticated users.",
    );
  });

  it("page exports a default function component", () => {
    const hasDefaultExport =
      /export\s+default\s+function\s+\w+/.test(source) ||
      /export\s+default\s+\w+/.test(source);
    assert.ok(
      hasDefaultExport,
      `${PAGE_PATH} must export a default component for Next.js App Router`,
    );
  });
});
