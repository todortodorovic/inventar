/**
 * The one colour rule for money that can go either way (profit, margin,
 * change): green for gain, red for loss, `zero` (muted by default) for 0.
 * Use it everywhere a profit is shown so every section agrees.
 */
export function profitText(n: number, zero = "text-fg-muted") {
  return n > 0 ? "text-gain" : n < 0 ? "text-loss" : zero
}
