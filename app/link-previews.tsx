// Rough stand-ins for how a shared link unfurls in a feed, a chat and a
// message thread. They only need to show the card in context, not match
// each app pixel for pixel.

import { cn } from '@/lib/utils';

type LinkPreviewProps = {
  image: React.ReactNode;
  title: string;
  site: string;
  excerpt: string;
  author: string;
  domain: string;
};

function Avatar({ name, className }: { name: string; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center bg-foreground/10 text-sm font-medium text-foreground/70', className)}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function FeedPost({ image, title, author, domain }: LinkPreviewProps) {
  const name = author || 'You';
  return (
    <div className="mx-auto w-full max-w-[540px] rounded-xl border bg-background p-4">
      <div className="flex gap-3">
        <Avatar name={name} className="size-10 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-5">
            <span className="font-semibold">{name}</span>{' '}
            <span className="text-muted-foreground">@{name.toLowerCase().replace(/\s+/g, '')}</span>
          </p>
          <p className="mt-0.5 text-[15px] leading-5">{title}</p>
          <div className="relative mt-3 overflow-hidden rounded-2xl border">
            {image}
            <span className="absolute bottom-2.5 left-2.5 rounded-sm bg-black/65 px-1.5 py-0.5 text-[13px] text-white">
              {domain}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatUnfurl({ image, title, site, excerpt, author, domain }: LinkPreviewProps) {
  const name = author || 'You';
  return (
    <div className="mx-auto w-full max-w-[540px] rounded-xl border bg-background p-4">
      <div className="flex gap-2.5">
        <Avatar name={name} className="size-9 rounded-md" />
        <div className="min-w-0 flex-1 text-[15px] leading-[22px]">
          <p className="font-bold">{name}</p>
          <p className="truncate text-sky-700 dark:text-sky-400">https://{domain}/</p>
          <div className="mt-1.5 border-l-4 border-foreground/15 pl-3">
            <p className="font-bold">{site}</p>
            <p className="font-bold text-sky-700 dark:text-sky-400">{title}</p>
            {excerpt ? <p className="line-clamp-2">{excerpt}</p> : null}
            <div className="mt-2 max-w-[360px] overflow-hidden rounded-lg border">{image}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageBubble({ image, title, domain }: LinkPreviewProps) {
  return (
    <div className="mx-auto flex w-full max-w-[540px] justify-end">
      <div className="w-full max-w-[300px] overflow-hidden rounded-[18px] bg-foreground/[0.07]">
        {image}
        <div className="px-3.5 py-2.5">
          <p className="line-clamp-2 text-[13px] leading-[17px] font-semibold">{title}</p>
          <p className="text-[13px] leading-[17px] text-muted-foreground">{domain}</p>
        </div>
      </div>
    </div>
  );
}
