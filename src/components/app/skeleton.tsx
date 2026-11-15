import { cn } from "@/lib/utils"

/** Placeholder while the browser's data is read (`useInventory()` is still `null`). */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-fg/[0.055]", className)} aria-hidden />
}

/** A generic panel-shaped placeholder: a row of tiles and a list. */
export function PanelSkeleton({ label, tiles = 4, rows = 6 }: { label: string; tiles?: number; rows?: number }) {
  return (
    <div role="status" aria-label={label} className="flex flex-col gap-4">
      {tiles > 0 && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: tiles }, (_, i) => (
            <div key={i} className="flex h-[118px] flex-col gap-3 rounded-(--radius-card) border border-hairline bg-card p-4 shadow-card">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2 rounded-(--radius-card) border border-hairline bg-card p-4 shadow-card">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  )
}
