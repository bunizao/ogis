import { cn } from '@/lib/utils';

// A wireframe of an OG card while it renders: site, title, excerpt and byline,
// the parts most themes lay out. Sizes are container units, so the same bones
// fit a gallery thumbnail and the full playground preview. Fills the nearest
// `relative` box. Spans only, so it can sit inside a button.
export function OgCardSkeleton() {
  return (
    <span data-slot="og-card-skeleton" aria-hidden="true" className="@container absolute inset-0 bg-muted">
      <span className="flex size-full flex-col justify-between p-[6cqw] motion-safe:animate-pulse">
        <span className="flex items-center gap-[2cqw]">
          <Bone className="size-[4cqw]" />
          <Bone className="h-[2.4cqw] w-[18cqw]" />
        </span>
        <span className="flex flex-col gap-[2.4cqw]">
          <Bone className="h-[5.6cqw] w-[66cqw]" />
          <Bone className="h-[5.6cqw] w-[44cqw]" />
          <Bone className="mt-[1.6cqw] h-[2.4cqw] w-[52cqw]" />
        </span>
        <span className="flex items-center gap-[2cqw]">
          <Bone className="size-[4.4cqw]" />
          <Bone className="h-[2.4cqw] w-[20cqw]" />
          <Bone className="ml-auto h-[2.4cqw] w-[14cqw]" />
        </span>
      </span>
    </span>
  );
}

function Bone({ className }: { className: string }) {
  return <span className={cn('block shrink-0 rounded-full bg-foreground/10', className)} />;
}
