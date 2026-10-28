import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

const SYMBOLS: Record<string, string> = {
  Cmd: '⌘',
  Shift: '⇧',
  Enter: '↵',
};

export function ShortcutKeys({ keys, className }: { keys: string[]; className?: string }) {
  // Between two keys, `/` separates alternatives and `–` spans a range; on its own,
  // `/` is the slash key.
  const isDivider = (index: number) => ['/', '–'].includes(keys[index]) && index > 0 && index < keys.length - 1;

  return (
    <KbdGroup className={className}>
      {keys.map((key, index) =>
        isDivider(index) ? (
          <span key={index} className="text-xs text-muted-foreground/60">
            {keys[index]}
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
