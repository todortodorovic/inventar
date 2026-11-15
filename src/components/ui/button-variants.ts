import { cva, type VariantProps } from "class-variance-authority"

// Kept apart from button.tsx so server components (and links styled as
// buttons) can use the variants without pulling the Base UI button
// primitive into the client bundle.
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
        // Catena: dark pill with the pink "lip" underneath; lifts and glows pink on hover.
        brand:
          "rounded-full bg-ink font-display font-semibold text-cream shadow-[0_5px_0_0_var(--pop),0_14px_30px_-14px_rgb(22_22_26/0.5)] hover:-translate-y-[3px] hover:shadow-[0_5px_0_0_var(--pop),0_22px_40px_-14px_rgb(255_79_154/0.55)] active:not-aria-[haspopup]:translate-y-0",
        // Catena: frosted glass with a soft light inside (`.btn-glass` in globals.css).
        // Meant to sit over something colourful, like the hero ribbon.
        glass: "btn-glass relative rounded-full font-display font-semibold text-ink transition-[box-shadow]",
        // Catena: white pill for dark sections.
        inverse:
          "rounded-full bg-white font-display font-semibold text-night hover:-translate-y-0.5 active:not-aria-[haspopup]:translate-y-0",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        // App: the primary action of a page or dialog (use with `brand`).
        cta: "h-10 gap-2 px-[18px] text-[15px] has-data-[icon=inline-start]:pl-3.5 [&_svg:not([class*='size-'])]:size-[18px]",
        // Catena: large rounded CTA.
        pill: "h-auto min-h-[60px] gap-3.5 px-7 text-[19px] tracking-[-0.01em]",
        // Catena: large CTA ending in a round icon (→) that hugs the edge.
        "pill-icon": "h-auto min-h-[62px] gap-3.5 py-1.5 pr-1.5 pl-7 text-[19px] tracking-[-0.01em]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
