import { cn } from "@/lib/utils"

/** Placeholder while the browser's data is read (`useInventory()` is still `null`). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-ink/6", className)} aria-hidden />
}

/** A generic panel-shaped placeholder: a row of tiles and a list. */
export function PanelSkeleton({ label, tiles = 4, rows = 6 }: { label: string; tiles?: number; rows?: number }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4">
      {tiles > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: tiles }, (_, i) => (
            <Skeleton key={i} className="h-[112px] rounded-(--radius-card)" />
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-(--radius-card) border border-line bg-card p-5">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-11" />
        ))}
      </div>
    </div>
  )
}
