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
      <DialogContent className="max-w-md bg-[var(--bg-2)] border-[var(--border-1)]">
        <DialogHeader>
          <DialogTitle className="font-mono text-sm tracking-wide">
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-1 -mx-6 px-0">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.label}
              className="flex items-center justify-between px-6 py-2.5"
            >
              <span className="text-sm text-[var(--text-1)]">{shortcut.label}</span>
              <ShortcutKeys
                keys={shortcut.keys}
                kbdClassName="min-w-[28px] px-2 py-1 bg-[var(--bg-1)] border border-[var(--border-2)] rounded-md text-[10px] leading-none text-[var(--text-0)]"
                separatorClassName="text-[10px] opacity-45"
                dividerClassName="text-[10px] opacity-30 mx-0.5"
                iconClassName="size-3.5"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
