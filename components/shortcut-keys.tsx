import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

const SYMBOLS: Record<string, string> = {
  Cmd: '⌘',
  Shift: '⇧',
  Enter: '↵',
};

export function ShortcutKeys({ keys, className }: { keys: string[]; className?: string }) {
  // A `/` between two keys separates alternatives; on its own it is the slash key.
  const isDivider = (index: number) => keys[index] === '/' && index > 0 && index < keys.length - 1;

  return (
    <KbdGroup className={className}>
      {keys.map((key, index) =>
        isDivider(index) ? (
          <span key={index} className="text-xs text-muted-foreground/60">
            /
          </span>
        ) : (
          <Kbd key={index} aria-label={SYMBOLS[key] ? key : undefined} className={cn(SYMBOLS[key] && 'text-[13px]')}>
            {SYMBOLS[key] ?? key}
          </Kbd>
        )
      )}
    </KbdGroup>
  );
}
