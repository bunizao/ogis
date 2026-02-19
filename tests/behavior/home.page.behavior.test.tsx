import '../setup-dom';

import React, { createContext, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type RenderResult = ReturnType<typeof render>;

const root = process.cwd();

const state = {
  toastMessages: [] as string[],
};

function resetState() {
  state.toastMessages = [];
}

function installUiMocks() {
  const toastFactory = () => ({
    toast: {
      success: (message: string) => {
        state.toastMessages.push(message);
      },
    },
  });

  mock.module('sonner', toastFactory);

  const buttonFactory = () => ({
    Button: React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>(
      ({ asChild, children, ...props }, ref) => {
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children as React.ReactElement, props);
        }
        return (
          <button ref={ref} {...props}>
            {children}
          </button>
        );
      }
    ),
  });

  mock.module('@/components/ui/button', buttonFactory);
  mock.module(`${root}/components/ui/button.tsx`, buttonFactory);

  const inputFactory = () => ({
    Input: React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
      (props, ref) => <input ref={ref} {...props} />
    ),
  });

  mock.module('@/components/ui/input', inputFactory);
  mock.module(`${root}/components/ui/input.tsx`, inputFactory);

  const badgeFactory = () => ({
    Badge: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  });

  mock.module('@/components/ui/badge', badgeFactory);
  mock.module(`${root}/components/ui/badge.tsx`, badgeFactory);

  const tabsFactory = () => {
    const TabsContext = createContext<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>({});

    return {
      Tabs: ({ value, onValueChange, children, ...props }: any) => (
        <TabsContext.Provider value={{ value, onValueChange }}>
          <div {...props}>{children}</div>
        </TabsContext.Provider>
      ),
      TabsList: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      TabsTrigger: ({ value, children, ...props }: any) => {
        const ctx = useContext(TabsContext);
        return (
          <button
            type="button"
            data-active={ctx.value === value ? 'true' : 'false'}
            onClick={() => ctx.onValueChange?.(value)}
            {...props}
          >
            {children}
          </button>
        );
      },
    };
  };

  mock.module('@/components/ui/tabs', tabsFactory);
  mock.module(`${root}/components/ui/tabs.tsx`, tabsFactory);

  const selectFactory = () => {
    const SelectContext = createContext<{
      value?: string;
      onValueChange?: (value: string) => void;
    }>({});

    return {
      Select: ({ value, onValueChange, children }: any) => (
        <SelectContext.Provider value={{ value, onValueChange }}>
          <div>{children}</div>
        </SelectContext.Provider>
      ),
      SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      SelectValue: () => {
        const ctx = useContext(SelectContext);
        return <span>{ctx.value}</span>;
      },
      SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      SelectItem: ({ value, children, ...props }: any) => {
        const ctx = useContext(SelectContext);
        return (
          <button type="button" onClick={() => ctx.onValueChange?.(value)} {...props}>
            {children}
          </button>
        );
      },
    };
  };

  mock.module('@/components/ui/select', selectFactory);
  mock.module(`${root}/components/ui/select.tsx`, selectFactory);

  const dialogFactory = () => ({
    Dialog: ({ open, children }: any) => (open ? <div data-dialog-open="true">{children}</div> : null),
    DialogContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DialogHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    DialogTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
  });

  mock.module('@/components/ui/dialog', dialogFactory);
  mock.module(`${root}/components/ui/dialog.tsx`, dialogFactory);

  const separatorFactory = () => ({
    Separator: (props: any) => <hr {...props} />,
  });

  mock.module('@/components/ui/separator', separatorFactory);
  mock.module(`${root}/components/ui/separator.tsx`, separatorFactory);

  const tooltipFactory = () => ({
    TooltipProvider: ({ children }: any) => <>{children}</>,
    Tooltip: ({ children }: any) => <>{children}</>,
    TooltipTrigger: ({ asChild, children, ...props }: any) => {
      if (asChild && React.isValidElement(children)) {
        return React.cloneElement(children as React.ReactElement, props);
      }
      return <span {...props}>{children}</span>;
    },
    TooltipContent: () => null,
  });

  mock.module('@/components/ui/tooltip', tooltipFactory);
  mock.module(`${root}/components/ui/tooltip.tsx`, tooltipFactory);
}

async function renderHome(): Promise<RenderResult> {
  installUiMocks();
  const mod = await import(`../../app/page.tsx?behavior=${Math.random()}`);
  return render(React.createElement(mod.default));
}

function installClipboardMock() {
  const writeText = mock(async () => {});
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

function setPlatform(platform: string) {
  Object.defineProperty(window.navigator, 'platform', {
    value: platform,
    configurable: true,
  });
}

beforeEach(() => {
  resetState();
  mock.restore();
  setPlatform('MacIntel');
});

afterEach(() => {
  cleanup();
  mock.restore();
});

describe('Home page behavior', () => {
  test('Generate updates preview image url with timestamp and params', async () => {
    const nowSpy = spyOn(Date, 'now').mockReturnValue(1700000000000);
    const ui = await renderHome();

    const generateBtn = ui.getByRole('button', { name: /Generate/i });
    await userEvent.click(generateBtn);

    const preview = ui.getByRole('img', { name: 'OG Preview' });
    const src = preview.getAttribute('src');
    expect(src).toBeTruthy();

    const parsed = new URL(src ?? '', 'https://example.com');
    expect(parsed.pathname).toBe('/api/og');
    expect(parsed.searchParams.get('title')).toBe('Interstellar');
    expect(parsed.searchParams.get('site')).toBe('buxx.me');
    expect(parsed.searchParams.get('t')).toBe('1700000000000');
    expect(parsed.searchParams.get('theme')).toBeNull();

    nowSpy.mockRestore();
  });

  test('copy button writes absolute url to clipboard and triggers success toast', async () => {
    const writeText = installClipboardMock();
    const ui = await renderHome();

    const copyBtn = ui.getByRole('button', { name: /Copy/i });
    await userEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    const copied = writeText.mock.calls[0]?.[0] as string;
    expect(copied.startsWith('https://example.com/api/og?')).toBeTrue();
    expect(copied.includes('title=Interstellar')).toBeTrue();
    expect(copied.includes('site=buxx.me')).toBeTrue();
    expect(state.toastMessages).toEqual(['Copied to clipboard']);
  });

  test('keyboard shortcut ? opens shortcuts dialog and Escape closes it', async () => {
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: '?' });
    expect(ui.getByText('Keyboard Shortcuts')).toBeTruthy();

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(ui.queryByText('Keyboard Shortcuts')).toBeNull();
    });
  });

  test('keyboard shortcut / focuses title input', async () => {
    const ui = await renderHome();

    const titleInput = ui.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.keyDown(window, { key: '/' });
    expect(document.activeElement).toBe(titleInput);
  });

  test('keyboard shortcuts 1/2 switch themes when not in input', async () => {
    const ui = await renderHome();

    expect(ui.getByText('Pixel Font')).toBeTruthy();

    fireEvent.keyDown(window, { key: '2' });
    await waitFor(() => {
      expect(ui.queryByText('Pixel Font')).toBeNull();
      expect(ui.getAllByText('modern').length).toBeGreaterThan(0);
    });

    fireEvent.keyDown(window, { key: '1' });
    await waitFor(() => {
      expect(ui.getByText('Pixel Font')).toBeTruthy();
      expect(ui.getAllByText(/pixel/i).length).toBeGreaterThan(0);
    });
  });

  test('Ctrl+Enter generates preview from keyboard, Ctrl+Shift+C copies URL', async () => {
    const nowSpy = spyOn(Date, 'now').mockReturnValue(1700000001234);
    const writeText = installClipboardMock();
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });

    const preview = ui.getByRole('img', { name: 'OG Preview' });
    const parsed = new URL(preview.getAttribute('src') ?? '', 'https://example.com');
    expect(parsed.searchParams.get('t')).toBe('1700000001234');

    fireEvent.keyDown(window, { key: 'c', ctrlKey: true, shiftKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    nowSpy.mockRestore();
  });
});
