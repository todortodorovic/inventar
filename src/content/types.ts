import type { sr } from "@/content/dictionaries/sr"

/**
 * Shape of every dictionary: the Serbian one is the source of truth, and the
 * compiler lists anything another language is missing. Strings may contain
 * `{placeholders}` (filled with `fill()`), and `Plural` entries are picked
 * with `plural()`, both from `@/lib/format`.
 */
export type Dictionary = typeof sr
