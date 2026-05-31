/**
 * Badge configuration constants shared across UI components.
 *
 * Extracted as a pure data module so it can be unit-tested without
 * a DOM / React environment.
 */

export interface BadgeConfig {
  /** Visible label text */
  label: string;
  /** Background color (CSS value) */
  background: string;
  /** Text color (CSS value) */
  color: string;
  /** Border color (CSS value) */
  border: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font weight */
  fontWeight: number;
  /** Border radius in pixels */
  borderRadius: number;
  /** Horizontal padding in pixels */
  paddingX: number;
  /** Vertical padding in pixels */
  paddingY: number;
  /** Letter spacing (CSS value) */
  letterSpacing: string;
}

/**
 * Configuration for the "Beta" product-stage badge that appears next to the
 * Noonchi logo across all page headers.
 */
export const BETA_BADGE: BadgeConfig = {
  label: "Beta",
  background: "rgba(225, 29, 72, 0.10)",
  color: "#E11D48",
  border: "rgba(225, 29, 72, 0.28)",
  fontSize: 10,
  fontWeight: 600,
  borderRadius: 3,
  paddingX: 6,
  paddingY: 2,
  letterSpacing: "0.04em",
};
