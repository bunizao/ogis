'use client';

import { ShortcutKeys } from '@/components/shortcut-keys';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type Shortcut = { label: string; keys: string[] };

export default function ShortcutsDialog({
  shortcuts,
  onOpenChange,
}: {
  shortcuts: Shortcut[];
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription className="sr-only">Shortcuts available on this page.</DialogDescription>
        </DialogHeader>
        <dl className="px-5 pb-3">
          {shortcuts.map(shortcut => (
            <div key={shortcut.label} className="flex items-center justify-between border-t py-2.5">
              <dt className="text-sm">{shortcut.label}</dt>
              <dd>
                <ShortcutKeys keys={shortcut.keys} />
              </dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
