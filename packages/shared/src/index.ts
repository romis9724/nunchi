// Client-safe exports only. The Node-only filesystem utilities
// (countEventFiles, validateEventSchema, assertDataCompleteness) must be
// imported directly from their files (e.g., `@nunchi/shared/countEventFiles`)
// to keep them out of browser bundles — they pull in node:fs.
export * from "./types";
