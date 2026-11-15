import { cn } from "@/lib/utils"

const sizes = {
  md: { mark: "size-7", text: "text-[17px]" },
  sm: { mark: "size-6", text: "text-[16px]" },
}

/**
 * Face colours of the mark per background. The lid is always lime (stock
 * that is ready to go); the sides take the ink of the surface they sit on,
 * and the seams are cut in that surface's colour.
 */
const tones = {
  light: { face: "var(--graphite-900)", seam: "var(--surface)", text: "text-fg" },
  dark: { face: "var(--sidebar-fg)", seam: "var(--sidebar)", text: "text-sidebar-fg" },
}

/** The mark alone: an isometric box with a lime lid. */
export function LogoMark({ tone = "light", className }: { tone?: keyof typeof tones; className?: string }) {
  const c = tones[tone]
  return (
    <svg viewBox="0 0 28 28" className={cn("shrink-0", className)} aria-hidden>
      <g stroke={c.seam} strokeWidth="1.3" strokeLinejoin="round">
        <path d="M14 2.5 24.5 8.5 14 14.5 3.5 8.5Z" fill="var(--accent)" />
        <path d="M3.5 8.5 14 14.5V26.5L3.5 20.5Z" fill={c.face} fillOpacity="0.94" />
        <path d="M24.5 8.5V20.5L14 26.5V14.5Z" fill={c.face} fillOpacity="0.5" />
      </g>
    </svg>
  )
}

/** Mark + lowercase wordmark in Inter semibold. `tone="dark"` on the graphite sidebar. */
export function Logo({
  size = "md",
  tone = "light",
  className,
}: {
  size?: keyof typeof sizes
  tone?: keyof typeof tones
  className?: string
}) {
  const s = sizes[size]
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-semibold tracking-[-0.03em]", tones[tone].text, s.text, className)}>
      <LogoMark tone={tone} className={s.mark} />
      inventar
    </span>
  )
}
