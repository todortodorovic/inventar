import { cva, type VariantProps } from "class-variance-authority"

// Kept apart from button.tsx so server components (and links styled as
// buttons) can use the variants without pulling the Base UI button
// primitive into the client bundle.
export const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,box-shadow] duration-150 outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // The ONE page-level call to action (Novi artikal, Nova pošiljka, Nova
        // prodaja…) and a dialog's confirm: lime fill, near-black text.
        primary:
          "border-accent-press/70 bg-accent font-semibold text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_1px_2px_rgb(17_21_28/0.12)] hover:bg-accent-hover active:border-accent-press active:bg-accent-press active:shadow-[inset_0_1px_2px_rgb(17_21_28/0.12)]",
        // In-card primary (Pošalji, Leglo on a shipment card; Prodaj on an
        // article card): graphite fill, white text, so lime stays rare.
        dark: "bg-graphite-900 text-fg-inverse shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_1px_2px_rgb(17_21_28/0.2)] hover:bg-graphite-800 active:bg-graphite-950",
        outline:
          "border-hairline-strong bg-surface text-fg shadow-xs hover:border-fg-faint/40 hover:bg-surface-hover active:bg-sunken aria-expanded:bg-sunken",
        ghost: "text-fg-soft hover:bg-sunken hover:text-fg active:bg-sunken-strong aria-expanded:bg-sunken aria-expanded:text-fg",
        destructive:
          "border-danger/20 bg-danger-soft text-danger-ink hover:border-danger/35 hover:bg-[color-mix(in_oklab,var(--danger-soft),var(--danger)_9%)] focus-visible:outline-danger",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        sm: "h-7 gap-1 rounded-sm px-2.5 text-[0.8rem] has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        icon: "size-8",
        "icon-lg": "size-9",
        // The size for page and dialog actions: 40px touch target on phones, 36px with a mouse.
        cta: "h-10 gap-1.5 px-3.5 text-[13.5px] md:h-9 has-data-[icon=inline-start]:pl-3 [&_svg:not([class*='size-'])]:size-4",
      },
    },
    defaultVariants: {
      variant: "dark",
      size: "default",
    },
  }
)

export type ButtonVariantProps = VariantProps<typeof buttonVariants>
