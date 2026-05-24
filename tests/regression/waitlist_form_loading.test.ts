/**
 * Component loading-state tests for WaitlistForm — Sub-AC 8d-2
 *
 * Verifies that when the form transitions to "loading" status (immediately
 * after the user submits and while the API response is still pending) the
 * submit button's derived render properties correctly reflect the loading UI:
 *
 *   - disabled = true       (button must not be re-submittable)
 *   - opacity  = 0.6        (visual feedback: dimmed appearance)
 *   - label    = "신청 중…"  (textual in-flight feedback)
 *
 * The pure derivation function `getWaitlistSubmitButtonProps` is extracted
 * from the WaitlistForm component (apps/web/app/(landing)/page.tsx) so that
 * these properties can be verified without a DOM or React environment — the
 * same injectable-dependency pattern used by `callWaitlistApi`, `handleWaitlistPost`,
 * etc.
 *
 * Run: tsx --test regression/waitlist_form_loading.test.ts
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getWaitlistSubmitButtonProps,
  type WaitlistFormStatus,
  type SubmitButtonProps,
} from "../../apps/web/lib/waitlist.js";

// ---------------------------------------------------------------------------
// Sub-AC 8d-2: loading state — button disabled + visual feedback
// ---------------------------------------------------------------------------

describe("WaitlistForm submit button — Sub-AC 8d-2: loading UI state", () => {
  // ── disabled ─────────────────────────────────────────────────────────────

  it("button is disabled while the API call is in-flight (status='loading')", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.disabled,
      true,
      "submit button must be disabled to prevent duplicate submissions"
    );
  });

  it("button is NOT disabled in idle state (status='idle')", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.disabled,
      false,
      "submit button must be enabled when the form is idle"
    );
  });

  it("button is NOT disabled after an error (status='error')", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.disabled,
      false,
      "submit button must be re-enabled after an error so the user can retry"
    );
  });

  // ── opacity ───────────────────────────────────────────────────────────────

  it("button opacity is 0.6 (dimmed) while loading (status='loading')", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.opacity,
      0.6,
      "opacity must be 0.6 to give a visual loading cue"
    );
  });

  it("button opacity is 1 (full) when idle (status='idle')", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(props.opacity, 1, "opacity must be 1 in the default idle state");
  });

  it("button opacity is 1 (full) after an error (status='error')", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.opacity,
      1,
      "opacity must return to 1 after an error so the button looks actionable again"
    );
  });

  // ── label ─────────────────────────────────────────────────────────────────

  it("button label is '신청 중…' while loading (status='loading')", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.label,
      "신청 중…",
      "button label must indicate in-flight status while the API call is pending"
    );
  });

  it("button label is '사전 신청' when idle (status='idle')", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.label,
      "사전 신청",
      "button label must be the default CTA text when the form is idle"
    );
  });

  it("button label is '사전 신청' after an error (status='error') so user can retry", () => {
    // Arrange
    const status: WaitlistFormStatus = "error";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert
    assert.equal(
      props.label,
      "사전 신청",
      "button label must revert to CTA text after an error"
    );
  });

  // ── combined loading snapshot ─────────────────────────────────────────────

  it("all three loading properties are correct simultaneously (disabled + opacity + label)", () => {
    // Arrange
    const status: WaitlistFormStatus = "loading";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert — full loading state snapshot
    assert.deepEqual(
      props,
      {
        disabled: true,
        opacity: 0.6,
        label: "신청 중…",
      },
      "all loading-state properties must match the expected snapshot"
    );
  });

  // ── combined idle snapshot ────────────────────────────────────────────────

  it("all three idle properties are correct simultaneously (enabled + opacity + label)", () => {
    // Arrange
    const status: WaitlistFormStatus = "idle";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert — full idle state snapshot
    assert.deepEqual(
      props,
      {
        disabled: false,
        opacity: 1,
        label: "사전 신청",
      },
      "all idle-state properties must match the expected snapshot"
    );
  });

  // ── state transition: idle → loading ─────────────────────────────────────

  it("properties differ between idle and loading — transition is observable", () => {
    // Arrange
    const idleProps  = getWaitlistSubmitButtonProps("idle");
    const loadingProps = getWaitlistSubmitButtonProps("loading");

    // Assert: loading must differ on all three axes
    assert.notEqual(
      idleProps.disabled,
      loadingProps.disabled,
      "disabled must toggle between idle and loading"
    );
    assert.notEqual(
      idleProps.opacity,
      loadingProps.opacity,
      "opacity must change between idle and loading"
    );
    assert.notEqual(
      idleProps.label,
      loadingProps.label,
      "label must change between idle and loading"
    );
  });

  // ── no other status triggers loading behaviour ────────────────────────────

  it("'done' status does NOT produce loading props (button not disabled, full opacity)", () => {
    // Arrange
    const status: WaitlistFormStatus = "done";

    // Act
    const props: SubmitButtonProps = getWaitlistSubmitButtonProps(status);

    // Assert: "done" is handled separately (form is hidden), but the derivation
    // function should not return loading props for it.
    assert.equal(
      props.disabled,
      false,
      "button must not be disabled for 'done' status"
    );
    assert.equal(
      props.opacity,
      1,
      "opacity must be 1 for 'done' status"
    );
  });
});
