'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ShortcutKeys } from '@/components/shortcut-keys';

export default function ShortcutsDialog({
  shortcuts,
  onOpenChange,
}: {
  shortcuts: Array<{ label: string; keys: string[] }>;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 sm:max-w-sm border-[var(--border-1)] bg-[var(--bg-1)] p-0">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="px-5 pb-3">
          {shortcuts.map(shortcut => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between border-t border-[var(--border-0)] py-2.5"
            >
              <span className="text-[14px] text-[var(--text-1)]">{shortcut.label}</span>
              <ShortcutKeys
                keys={shortcut.keys}
                className="gap-0.5"
                kbdClassName="h-[22px] min-w-[22px] px-1.5 rounded-[5px] border-[var(--border-1)] bg-[var(--bg-2)] text-[11px] text-[var(--text-1)]"
                separatorClassName="hidden"
                dividerClassName="mx-0.5 text-[11px] text-[var(--text-2)] opacity-100"
                iconClassName="size-3"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
