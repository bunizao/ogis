import { ArrowUp, Command, CornerDownLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShortcutKeys({
  keys,
  className,
  kbdClassName,
  separatorClassName,
  dividerClassName,
  iconClassName,
}: {
  keys: string[];
  className?: string;
  kbdClassName?: string;
  separatorClassName?: string;
  dividerClassName?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      {keys.map((key, index) => {
        const previousKey = keys[index - 1];
        const showPlus = index > 0 && key !== '/' && previousKey !== '/';

        return (
          <span key={`${key}-${index}`} className="inline-flex items-center gap-1">
            {showPlus ? (
              <span className={cn('text-current/55', separatorClassName)}>+</span>
            ) : null}
            {key === '/' ? (
              <span className={cn('mx-0.5 text-[10px] opacity-30', dividerClassName)}>
                /
              </span>
            ) : (
              <ShortcutKeycap
                value={key}
                className={kbdClassName}
                iconClassName={iconClassName}
              />
            )}
          </span>
        );
      })}
    </span>
  );
}

function ShortcutKeycap({
  value,
  className,
  iconClassName,
}: {
  value: string;
  className?: string;
  iconClassName?: string;
}) {
  const iconMap = {
    Cmd: Command,
    Enter: CornerDownLeft,
    Shift: ArrowUp,
  } as const;
  const Icon = iconMap[value as keyof typeof iconMap];
  const symbolClassName = cn('text-[0.95em] leading-none', iconClassName);
  const keySymbol = value === 'Ctrl' ? '⌃' : null;

  return (
    <kbd
      className={cn(
        'inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 border rounded-md font-mono leading-none',
        className
      )}
    >
      {Icon ? (
        <>
          <Icon className={cn('size-3.5', iconClassName)} aria-hidden="true" />
          <span className="sr-only">{value}</span>
        </>
      ) : keySymbol ? (
        <>
          <span className={symbolClassName} aria-hidden="true">
            {keySymbol}
          </span>
          <span className="sr-only">{value}</span>
        </>
      ) : (
        value
      )}
    </kbd>
  );
}
