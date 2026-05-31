/**
 * submitInquiry — server action for the /contact page.
 *
 * Inserts a new record into the `inquiries` Supabase table and returns
 * the inserted row.
 *
 * The /contact route is publicly accessible: the caller does NOT need to be
 * authenticated. The optional `user_id` field links the inquiry to an
 * authenticated user when one is present in the session.
 *
 * A Supabase client can be injected via the optional `supabaseClient`
 * parameter so this function is fully unit-testable without a real database.
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** The payload accepted by submitInquiry. */
export interface InquiryInput {
  /** Sender name. Required. */
  name: string;
  /** Sender email address. Required. */
  email: string;
  /** Free-text inquiry message. Required. */
  message: string;
  /** Optional: the authenticated user's UUID when the sender is logged in. */
  user_id?: string;
}

/** The row returned by Supabase after a successful insert. */
export interface InquiryRow {
  id: string;
  name: string;
  email: string;
  message: string;
  user_id: string | null;
  created_at: string;
}

/**
 * Minimal structural interface for the Supabase client subset used by
 * submitInquiry. Defined locally so test environments can inject a mock
 * without importing @supabase/supabase-js.
 */
export interface InquiryInsertClient {
  from(table: "inquiries"): {
    insert(data: InquiryInput): {
      select(): {
        single(): Promise<{
          data: InquiryRow | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

// ── submitInquiry ─────────────────────────────────────────────────────────────

/**
 * Inserts a new inquiry record into the Supabase `inquiries` table and returns
 * the inserted row.
 *
 * Throws an `Error` when:
 *  - Any required field (`name`, `email`, `message`) is blank after trimming.
 *  - Supabase returns an error response.
 *  - The inserted row cannot be retrieved from Supabase.
 *
 * @param input          The inquiry data to insert.
 * @param supabaseClient Optional Supabase client (injected in tests). Defaults
 *                       to the server-side admin client via a lazy import so
 *                       that @supabase/supabase-js is never loaded when a mock
 *                       is provided.
 * @returns              The full inserted `InquiryRow`.
 */
export async function submitInquiry(
  input: InquiryInput,
  supabaseClient?: InquiryInsertClient
): Promise<InquiryRow> {
  // ── Validate ────────────────────────────────────────────────────────────────
  if (!input.name.trim()) {
    throw new Error("submitInquiry: name is required");
  }
  if (!input.email.trim()) {
    throw new Error("submitInquiry: email is required");
  }
  if (!input.message.trim()) {
    throw new Error("submitInquiry: message is required");
  }

  // ── Client ──────────────────────────────────────────────────────────────────
  let client: InquiryInsertClient;

  if (supabaseClient) {
    client = supabaseClient;
  } else {
    // Lazy import: @supabase/supabase-js is only resolved at runtime when no
    // mock is injected, keeping test environments dependency-free.
    const { getSupabaseAdmin } = await import("./supabase");
    client = getSupabaseAdmin() as unknown as InquiryInsertClient;
  }

  // ── Insert ──────────────────────────────────────────────────────────────────
  const { data, error } = await client
    .from("inquiries")
    .insert({
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      ...(input.user_id !== undefined && { user_id: input.user_id }),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`submitInquiry: Supabase error — ${error.message}`);
  }

  if (!data) {
    throw new Error("submitInquiry: insert succeeded but no row was returned");
  }

  return data;
}
