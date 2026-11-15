import { cn } from "@/lib/utils"

const sizes = {
  md: { dot: "size-4 not-first:-ml-1.5", text: "text-[22px] tracking-[-0.04em] font-bold" },
  sm: { dot: "size-3 not-first:-ml-1", text: "text-[17px] tracking-[-0.03em] font-semibold" },
}

/** Three overlapping dots + the wordmark (Catena's mark). Colours come from `--dot-1..3`. */
export function Logo({ size = "md", className }: { size?: keyof typeof sizes; className?: string }) {
  const s = sizes[size]
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display", s.text, className)}>
      <span className="flex" aria-hidden>
        <span className={cn("rounded-full bg-dot-1", s.dot)} />
        <span className={cn("rounded-full bg-dot-2 mix-blend-multiply", s.dot)} />
        <span className={cn("rounded-full bg-dot-3 mix-blend-multiply", s.dot)} />
      </span>
      inventar
    </span>
  )
}
