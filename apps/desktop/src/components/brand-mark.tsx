import { cn } from '@/lib/utils'
import { useTheme } from '@/themes'

const assetPath = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`

// Brand badge: the OLYMPUS mark (navy squircle, mountain + bolt) — same
// self-contained artwork in light and dark mode, so no theme branch is
// needed. The mark PNG carries its own rounded shape and transparent
// corners, so no tile/rounding classes here. Size via className (default
// size-14). Source artwork: /opt/data/olympus-brand/olympus-icon-1024.png.
export function BrandMark({ className, ...props }: React.ComponentProps<'span'>) {
  useTheme()

  return (
    <span className={cn('inline-flex size-14 shrink-0 items-center justify-center', className)} {...props}>
      <img alt="" className="size-full object-contain" src={assetPath('nous-girl.png')} />
    </span>
  )
}
