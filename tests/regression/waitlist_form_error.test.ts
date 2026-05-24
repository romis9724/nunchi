/**
 * Component failure-state tests for WaitlistForm — Sub-AC 8d-4
 *
 * Verifies that when /api/waitlist returns an error response (4xx/5xx) or a
 * network-level exception is thrown, the WaitlistForm renders the correct
 * failure UI state:
 *
 *   - showError = true   (error <p> must be rendered)
 *   - showForm  = true   (form stays visible so the user can retry)
 *   - errorMessage       (the exact error text from the server or network)
 *
 * The pure derivation function `getWaitlistFormErrorViewState` is extracted
 * from WaitlistForm (apps/web/app/(landing)/page.tsx) into
 * apps/web/lib/waitlist.ts so that failure-state behaviour can be verified
 * without a DOM or React environment — the same injectable-dependency pattern
 * used by `callWaitlistApi`, `getWaitlistSubmitButtonProps`, etc.
 *
 * Run: tsx --test regression/waitlist_form_error.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getWaitlistFormErrorViewState,
  WAITLIST_NETWORK_ERROR_MESSAGE,
  WAITLIST_FALLBACK_ERROR_MESSAGE,
  callWaitlistApi,
  type WaitlistFormStatus,
  type WaitlistErrorViewState,
  type FetchFn,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Sub-AC 8d-4: WaitlistForm — error UI state on 4xx/5xx/network failure
// ---------------------------------------------------------------------------

describe("WaitlistForm — failure UI state — Sub-AC 8d-4: error message rendered on API/network error", () => {

  // ── showError flag ─────────────────────────────────────────────────────────

  it("showError is true when status is 'error'", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const viewState: WaitlistErrorViewState = getWaitlistFormErrorViewState(status, "서버 오류");

    // Assert
    assert.equal(
      viewState.showError,
      true,
      "the error paragraph must be shown when status is 'error'"
    );
  });

  it("showError is false when status is 'idle'", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const viewState = getWaitlistFormErrorViewState(status);

    // Assert
    assert.equal(
      viewState.showError,
      false,
      "error paragraph must NOT be shown in idle state"
    );
  });

  it("showError is false when status is 'loading'", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const viewState = getWaitlistFormErrorViewState(status);

    // Assert
    assert.equal(
      viewState.showError,
      false,
      "error paragraph must NOT be shown while loading"
    );
  });

  it("showError is false when status is 'done'", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const viewState = getWaitlistFormErrorViewState(status);

    // Assert
    assert.equal(
      viewState.showError,
      false,
      "error paragraph must NOT be shown after a successful submission"
    );
  });

  // ── showForm flag in error state ──────────────────────────────────────────

  it("form remains visible (showForm = true) when status is 'error' so the user can retry", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const viewState = getWaitlistFormErrorViewState(status, "오류");

    // Assert
    assert.equal(
      viewState.showForm,
      true,
      "form must stay visible after an error so the user can correct and resubmit"
    );
  });

  // ── errorMessage content ──────────────────────────────────────────────────

  it("errorMessage contains the exact server error text passed to the function", () => {
    // Arrange
    const serverError = "이미 등록된 이메일입니다.";

    // Act
    const viewState = getWaitlistFormErrorViewState("error", serverError);

    // Assert
    assert.equal(
      viewState.errorMessage,
      serverError,
      "errorMessage must reflect the server-provided error text verbatim"
    );
  });

  it("errorMessage equals WAITLIST_FALLBACK_ERROR_MESSAGE when no errorText is provided", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const viewState = getWaitlistFormErrorViewState(status);

    // Assert
    assert.equal(
      viewState.errorMessage,
      WAITLIST_FALLBACK_ERROR_MESSAGE,
      "must fall back to WAITLIST_FALLBACK_ERROR_MESSAGE when no error text is supplied"
    );
  });

  it("errorMessage is null when status is 'idle' (no error to display)", () => {
    // Act
    const viewState = getWaitlistFormErrorViewState("idle");

    // Assert
    assert.equal(
      viewState.errorMessage,
      null,
      "errorMessage must be null when there is no error"
    );
  });

  it("errorMessage is null when status is 'loading'", () => {
    // Act
    const viewState = getWaitlistFormErrorViewState("loading");

    // Assert
    assert.equal(
      viewState.errorMessage,
      null,
      "errorMessage must be null while the API call is pending"
    );
  });

  it("errorMessage is null when status is 'done' (success, no error)", () => {
    // Act
    const viewState = getWaitlistFormErrorViewState("done");

    // Assert
    assert.equal(
      viewState.errorMessage,
      null,
      "errorMessage must be null after a successful submission"
    );
  });

  // ── Full error-state snapshot ─────────────────────────────────────────────

  it("error-state snapshot with explicit errorText: showForm=true, showError=true, errorMessage=text", () => {
    // Arrange
    const errorText = "등록 중 오류가 발생했습니다.";

    // Act
    const viewState = getWaitlistFormErrorViewState("error", errorText);

    // Assert — full snapshot
    assert.deepEqual(
      viewState,
      {
        showForm: true,
        showError: true,
        errorMessage: errorText,
      },
      "error-state snapshot must match expected shape"
    );
  });

  it("error-state snapshot without errorText uses the fallback message", () => {
    // Act
    const viewState = getWaitlistFormErrorViewState("error");

    // Assert — full snapshot with fallback
    assert.deepEqual(
      viewState,
      {
        showForm: true,
        showError: true,
        errorMessage: WAITLIST_FALLBACK_ERROR_MESSAGE,
      },
      "error-state without explicit text must use WAITLIST_FALLBACK_ERROR_MESSAGE"
    );
  });

  // ── Network failure constant ──────────────────────────────────────────────

  it("WAITLIST_NETWORK_ERROR_MESSAGE is a non-empty string (used by the catch block)", () => {
    assert.ok(
      typeof WAITLIST_NETWORK_ERROR_MESSAGE === "string" &&
        WAITLIST_NETWORK_ERROR_MESSAGE.length > 0,
      "WAITLIST_NETWORK_ERROR_MESSAGE must be a non-empty string"
    );
  });

  it("network error view state uses WAITLIST_NETWORK_ERROR_MESSAGE text", () => {
    // Act — simulate the component catch block:
    // catch { setErr("네트워크 오류"); setStatus("error"); }
    const viewState = getWaitlistFormErrorViewState(
      "error",
      WAITLIST_NETWORK_ERROR_MESSAGE
    );

    // Assert
    assert.equal(
      viewState.errorMessage,
      WAITLIST_NETWORK_ERROR_MESSAGE,
      "network error must produce the WAITLIST_NETWORK_ERROR_MESSAGE text in the UI"
    );
    assert.equal(viewState.showError, true);
    assert.equal(viewState.showForm, true);
  });

  // ── Only "error" status triggers the error UI ────────────────────────────

  it("only status='error' produces showError=true — all other statuses suppress the error UI", () => {
    const statuses: WaitlistFormStatus[] = ["idle", "loading", "done", "error"];

    for (const status of statuses) {
      const viewState = getWaitlistFormErrorViewState(status, "some error");

      if (status === "error") {
        assert.equal(
          viewState.showError,
          true,
          `showError must be true for status='error'`
        );
        assert.notEqual(
          viewState.errorMessage,
          null,
          `errorMessage must be non-null for status='error'`
        );
      } else {
        assert.equal(
          viewState.showError,
          false,
          `showError must be false for status='${status}'`
        );
        assert.equal(
          viewState.errorMessage,
          null,
          `errorMessage must be null for status='${status}'`
        );
      }
    }
  });

  // ── End-to-end: 4xx API response → error UI ───────────────────────────────

  it("callWaitlistApi returning ok:false on 422 → 'error' status → showError=true with server message", async () => {
    // Arrange: mock fetch returning 422 with a server error message
    const serverErrorMsg = "올바른 이메일 주소를 입력해주세요.";
    const mockFetch: FetchFn = async (_url, _init) =>
      new Response(JSON.stringify({ error: serverErrorMsg }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });

    // Act: simulate WaitlistForm.submit()
    const apiResult = await callWaitlistApi("bad-email", "hero", mockFetch);

    // Assert 1: API indicated failure
    assert.equal(apiResult.ok, false, "callWaitlistApi must return ok:false for 422");
    assert.equal(
      apiResult.error,
      serverErrorMsg,
      "callWaitlistApi must forward the server's error message"
    );

    // Simulate what the component does on failure:
    // if (!result.ok) { setErr(result.error ?? fallback); setStatus("error"); }
    const derivedStatus: WaitlistFormStatus = apiResult.ok ? "done" : "error";
    const errorText = apiResult.error ?? WAITLIST_FALLBACK_ERROR_MESSAGE;
    const viewState = getWaitlistFormErrorViewState(derivedStatus, errorText);

    // Assert 2: failure UI is active
    assert.equal(
      viewState.showError,
      true,
      "after a 422 response the error UI must be displayed"
    );
    assert.equal(
      viewState.errorMessage,
      serverErrorMsg,
      "after a 422 response the error message must match the server's message"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must remain visible after a 422 so the user can correct the email and retry"
    );
  });

  it("callWaitlistApi returning ok:false on 500 → 'error' status → showError=true", async () => {
    // Arrange: mock fetch returning 500
    const mockFetch: FetchFn = async (_url, _init) =>
      new Response(JSON.stringify({ error: "등록 중 오류가 발생했습니다." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });

    // Act
    const apiResult = await callWaitlistApi("user@example.com", "hero", mockFetch);

    // Assert 1: API indicated failure
    assert.equal(apiResult.ok, false, "callWaitlistApi must return ok:false for 500");

    // Simulate component failure path
    const derivedStatus: WaitlistFormStatus = apiResult.ok ? "done" : "error";
    const errorText = apiResult.error ?? WAITLIST_FALLBACK_ERROR_MESSAGE;
    const viewState = getWaitlistFormErrorViewState(derivedStatus, errorText);

    // Assert 2
    assert.equal(
      viewState.showError,
      true,
      "after a 500 response the error UI must be displayed"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must remain visible after a 500 so the user can retry"
    );
  });

  it("network failure (fetch throws) → 'error' status with WAITLIST_NETWORK_ERROR_MESSAGE", async () => {
    // Arrange: mock fetch that throws (simulates a network-level failure)
    const throwingFetch: FetchFn = async (_url, _init) => {
      throw new TypeError("Failed to fetch");
    };

    // Act: simulate the component try/catch:
    //   try { const result = await callWaitlistApi(...); ... }
    //   catch { setErr("네트워크 오류"); setStatus("error"); }
    let derivedStatus: WaitlistFormStatus = "idle";
    let errorText: string = "";

    try {
      await callWaitlistApi("user@example.com", "hero", throwingFetch);
      // Should not reach here
      derivedStatus = "done";
    } catch {
      derivedStatus = "error";
      errorText = WAITLIST_NETWORK_ERROR_MESSAGE;
    }

    const viewState = getWaitlistFormErrorViewState(derivedStatus, errorText);

    // Assert
    assert.equal(
      derivedStatus,
      "error",
      "status must be 'error' when callWaitlistApi throws"
    );
    assert.equal(
      viewState.showError,
      true,
      "error UI must be displayed after a network failure"
    );
    assert.equal(
      viewState.errorMessage,
      WAITLIST_NETWORK_ERROR_MESSAGE,
      "network failure must display WAITLIST_NETWORK_ERROR_MESSAGE"
    );
    assert.equal(
      viewState.showForm,
      true,
      "form must remain visible after a network failure so the user can retry"
    );
  });

  // ── Error state does NOT produce the success message ─────────────────────

  it("showForm is true after 'error' — not hidden like 'done'", () => {
    // The done state hides the form; error state must keep it visible.
    const errorViewState = getWaitlistFormErrorViewState("error", "some error");
    const doneViewState  = getWaitlistFormErrorViewState("done");

    assert.equal(errorViewState.showForm, true, "form must be visible in 'error' state");
    assert.equal(doneViewState.showForm, false, "form must be hidden in 'done' state");
    assert.notEqual(
      errorViewState.showForm,
      doneViewState.showForm,
      "'error' and 'done' states must differ on showForm"
    );
  });

  // ── WAITLIST_FALLBACK_ERROR_MESSAGE sanity ────────────────────────────────

  it("WAITLIST_FALLBACK_ERROR_MESSAGE is a non-empty string", () => {
    assert.ok(
      typeof WAITLIST_FALLBACK_ERROR_MESSAGE === "string" &&
        WAITLIST_FALLBACK_ERROR_MESSAGE.length > 0,
      "WAITLIST_FALLBACK_ERROR_MESSAGE must be a non-empty string"
    );
  });

  it("callWaitlistApi forwards server error message into WaitlistApiResult.error", async () => {
    // Arrange: API responds with a body that has a custom error message
    const customMsg = "이미 등록된 이메일입니다.";
    const mockFetch: FetchFn = async () =>
      new Response(JSON.stringify({ error: customMsg }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });

    // Act
    const result = await callWaitlistApi("existing@example.com", "hero", mockFetch);

    // Assert
    assert.equal(result.ok, false, "must return ok:false for 409");
    assert.equal(
      result.error,
      customMsg,
      "the server error message must be forwarded verbatim in result.error"
    );
  });

  it("callWaitlistApi uses fallback error when server body lacks 'error' field", async () => {
    // Arrange: 500 response with empty body
    const mockFetch: FetchFn = async () =>
      new Response(JSON.stringify({}), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });

    // Act
    const result = await callWaitlistApi("user@example.com", "hero", mockFetch);

    // Assert: callWaitlistApi must supply a non-empty fallback, not undefined
    assert.equal(result.ok, false, "must return ok:false for 500");
    assert.ok(
      typeof result.error === "string" && result.error.length > 0,
      "result.error must be a non-empty fallback string when the body has no 'error' field"
    );
  });
});
