/**
 * Component success-state tests for WaitlistForm — Sub-AC 8d-3
 *
 * Verifies that when /api/waitlist returns a 2xx response the WaitlistForm
 * transitions to status "done" and the success UI state (confirmation message)
 * renders correctly instead of the form.
 *
 * The pure derivation function `getWaitlistFormViewState` is extracted
 * from the WaitlistForm component (apps/web/app/(landing)/page.tsx) into
 * apps/web/lib/waitlist.ts so the success-state behaviour can be verified
 * without a DOM or React environment — the same injectable-dependency pattern
 * used by `callWaitlistApi`, `getWaitlistSubmitButtonProps`, etc.
 *
 * Run: tsx --test regression/waitlist_form_success.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getWaitlistFormViewState,
  WAITLIST_SUCCESS_MESSAGE,
  callWaitlistApi,
  type WaitlistFormStatus,
  type WaitlistFormViewState,
  type FetchFn,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Sub-AC 8d-3: success UI state after 2xx response
// ---------------------------------------------------------------------------

describe("WaitlistForm — success UI state — Sub-AC 8d-3: 2xx → confirmation message rendered", () => {
  // ── Form visibility on "done" ─────────────────────────────────────────────

  it("form is hidden when status is 'done' (after 2xx response)", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.equal(
      viewState.showForm,
      false,
      "the form element must NOT be shown after a successful API response"
    );
  });

  // ── Success message presence ──────────────────────────────────────────────

  it("a success message is present when status is 'done'", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.ok(
      viewState.successMessage !== null,
      "successMessage must be non-null after a 2xx response"
    );
    assert.ok(
      typeof viewState.successMessage === "string" &&
        viewState.successMessage.length > 0,
      "successMessage must be a non-empty string"
    );
  });

  // ── Success message content ───────────────────────────────────────────────

  it("success message contains the '신청 완료' confirmation text", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.ok(
      viewState.successMessage!.includes("신청 완료"),
      "confirmation message must include '신청 완료'"
    );
  });

  it("success message matches the exact WAITLIST_SUCCESS_MESSAGE constant", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert: the rendered message must be byte-identical to the constant so
    // the component and the test stay in sync via a single source of truth.
    assert.equal(
      viewState.successMessage,
      WAITLIST_SUCCESS_MESSAGE,
      "success message must exactly match the WAITLIST_SUCCESS_MESSAGE constant"
    );
  });

  // ── Full "done" snapshot ──────────────────────────────────────────────────

  it("done-state view state snapshot: showForm=false, successMessage=WAITLIST_SUCCESS_MESSAGE", () => {
    // Act
    const viewState = getWaitlistFormViewState("done");

    // Assert — full snapshot
    assert.deepEqual(
      viewState,
      {
        showForm: false,
        successMessage: WAITLIST_SUCCESS_MESSAGE,
      },
      "done-state view state must match the full expected snapshot"
    );
  });

  // ── Other statuses do NOT show the success message ────────────────────────

  it("success message is null when status is 'idle' (form visible)", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.equal(
      viewState.successMessage,
      null,
      "success message must not appear when the form is in its initial idle state"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must be visible in idle state"
    );
  });

  it("success message is null when status is 'loading' (API call in-flight)", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.equal(
      viewState.successMessage,
      null,
      "success message must not appear while the API call is pending"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must remain visible while loading"
    );
  });

  it("success message is null when status is 'error' (user can retry)", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const viewState: WaitlistFormViewState = getWaitlistFormViewState(status);

    // Assert
    assert.equal(
      viewState.successMessage,
      null,
      "success message must not appear after an error — the form stays visible so the user can retry"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must remain visible after an error"
    );
  });

  // ── Transition: only "done" produces the success state ───────────────────

  it("only status='done' produces showForm=false — all other statuses show the form", () => {
    const statuses: WaitlistFormStatus[] = ["idle", "loading", "error", "done"];

    for (const status of statuses) {
      const viewState = getWaitlistFormViewState(status);

      if (status === "done") {
        assert.equal(
          viewState.showForm,
          false,
          `showForm must be false for status='done'`
        );
        assert.notEqual(
          viewState.successMessage,
          null,
          `successMessage must be non-null for status='done'`
        );
      } else {
        assert.equal(
          viewState.showForm,
          true,
          `showForm must be true for status='${status}'`
        );
        assert.equal(
          viewState.successMessage,
          null,
          `successMessage must be null for status='${status}'`
        );
      }
    }
  });

  // ── End-to-end integration: 2xx response → "done" state → success UI ─────

  it("callWaitlistApi returning ok:true corresponds to the 'done' status which shows the success message", async () => {
    // Arrange: mock fetch that returns 200
    const mockFetch: FetchFn = async (_url, _init) =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });

    // Act: simulate what WaitlistForm.submit() does after a successful call
    const apiResult = await callWaitlistApi("user@example.com", "hero", mockFetch);

    // Assert 1: API returned ok
    assert.equal(apiResult.ok, true, "callWaitlistApi must return ok:true for a 200 response");

    // Derive the status the component would set: ok:true → "done"
    const derivedStatus: WaitlistFormStatus = apiResult.ok ? "done" : "error";

    // Assert 2: that derived status yields the success UI
    const viewState = getWaitlistFormViewState(derivedStatus);
    assert.equal(
      viewState.showForm,
      false,
      "after a 2xx API response the form must be hidden"
    );
    assert.equal(
      viewState.successMessage,
      WAITLIST_SUCCESS_MESSAGE,
      "after a 2xx API response the success confirmation message must be shown"
    );
  });

  it("callWaitlistApi returning ok:false does NOT produce the success UI state", async () => {
    // Arrange: mock fetch that returns 422
    const mockFetch: FetchFn = async (_url, _init) =>
      new Response(JSON.stringify({ error: "mock error" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

    // Act
    const apiResult = await callWaitlistApi("bad@example.com", "hero", mockFetch);

    // Assert 1: API returned error
    assert.equal(apiResult.ok, false, "callWaitlistApi must return ok:false for a 422 response");

    // Derive the status the component would set: ok:false → "error"
    const derivedStatus: WaitlistFormStatus = apiResult.ok ? "done" : "error";

    // Assert 2: error status keeps form visible, no success message
    const viewState = getWaitlistFormViewState(derivedStatus);
    assert.equal(
      viewState.showForm,
      true,
      "after a non-2xx API response the form must remain visible"
    );
    assert.equal(
      viewState.successMessage,
      null,
      "after a non-2xx API response no success message should appear"
    );
  });
});
