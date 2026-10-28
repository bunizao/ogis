import '../setup-dom';

import React from 'react';
import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { cleanup, fireEvent, render, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

type RenderResult = ReturnType<typeof render>;

async function renderHome(): Promise<RenderResult> {
  const mod = await import(`../../app/page.tsx?behavior=${Math.random()}`);
  return render(React.createElement(mod.default));
}

function previewParams(ui: RenderResult): URLSearchParams {
  const src = ui.getByRole('img', { name: 'OG Preview' }).getAttribute('src') ?? '';
  const url = new URL(src, 'https://example.com');
  expect(url.pathname).toBe('/api/og');
  return url.searchParams;
}

function checkedTheme(ui: RenderResult): string | null {
  const group = ui.getByRole('radiogroup', { name: 'Theme' });
  return within(group).getByRole('radio', { checked: true }).textContent;
}

function installClipboardMock() {
  const writeText = mock(async (_text: string) => {});
  Object.defineProperty(window.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

beforeEach(() => {
  Object.defineProperty(window.navigator, 'platform', { value: 'MacIntel', configurable: true });
  // jsdom has no layout, so scrolling is a no-op the theme gallery still calls.
  window.HTMLElement.prototype.scrollIntoView = () => {};
});

afterEach(() => {
  cleanup();
  mock.restore();
});

describe('Home page behavior', () => {
  test('first render previews the sample post on the default theme', async () => {
    const ui = await renderHome();
    const params = previewParams(ui);

    expect(params.get('title')).toBe('Interstellar');
    expect(params.get('site')).toBe('buxx.me');
    expect(params.get('tag')).toBe('Essay');
    expect(params.get('theme')).toBeNull();
    expect(params.get('t')).toBeNull();
    expect(checkedTheme(ui)).toBe('Pixel');
  });

  test('typing updates the preview after a pause', async () => {
    const ui = await renderHome();
    const title = ui.getByLabelText('Title');

    await userEvent.clear(title);
    await userEvent.type(title, 'Hello');
    expect(previewParams(ui).get('title')).toBe('Interstellar');

    await waitFor(() => expect(previewParams(ui).get('title')).toBe('Hello'));
  });

  test('accent is sent without the hash', async () => {
    const ui = await renderHome();

    await userEvent.type(ui.getByLabelText('Accent hex'), '#e4002b');

    await waitFor(() => expect(previewParams(ui).get('accent')).toBe('e4002b'));
  });

  test('Refresh re-renders with a cache-busting timestamp', async () => {
    const nowSpy = spyOn(Date, 'now').mockReturnValue(1700000000000);
    const ui = await renderHome();

    await userEvent.click(ui.getByRole('button', { name: /Refresh/ }));

    expect(previewParams(ui).get('t')).toBe('1700000000000');
    nowSpy.mockRestore();
  });

  test('picking a theme re-renders at once and hides the pixel font picker', async () => {
    const ui = await renderHome();
    expect(ui.getByText('Pixel font')).toBeTruthy();

    await userEvent.click(ui.getByRole('radio', { name: 'Editorial' }));

    expect(checkedTheme(ui)).toBe('Editorial');
    expect(previewParams(ui).get('theme')).toBe('editorial');
    expect(ui.queryByText('Pixel font')).toBeNull();
  });

  test('theme gallery tiles select their theme', async () => {
    const ui = await renderHome();
    const tile = ui.getByRole('button', { name: /Swiss theme example/ });

    expect(tile.getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(tile);

    expect(tile.getAttribute('aria-pressed')).toBe('true');
    expect(checkedTheme(ui)).toBe('Swiss');
    expect(previewParams(ui).get('theme')).toBe('swiss');
  });

  test('sample covers set the image at once, credit it, and None clears it', async () => {
    const ui = await renderHome();
    const covers = ui.getByRole('group', { name: 'Sample covers' });
    const none = within(covers).getByRole('button', { name: 'No cover' });
    expect(none.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(within(covers).getByRole('button', { name: 'Carina Nebula' }));

    expect(previewParams(ui).get('image')).toStartWith('https://images.unsplash.com/');
    expect(previewParams(ui).get('image')).toContain('fm=jpg');
    expect(ui.getByRole('link', { name: 'NASA' }).getAttribute('href')).toContain('unsplash.com/photos/');

    await userEvent.click(none);

    expect(previewParams(ui).get('image')).toBeNull();
    expect(none.getAttribute('aria-pressed')).toBe('true');
  });

  test('preview tabs show the card inside a link unfurl', async () => {
    const ui = await renderHome();

    await userEvent.click(ui.getByRole('tab', { name: 'Slack' }));
    expect(ui.getByText('https://buxx.me/')).toBeTruthy();
    expect(previewParams(ui).get('title')).toBe('Interstellar');

    // A site name that is not a domain falls back to a placeholder one.
    await userEvent.clear(ui.getByLabelText('Site'));
    await userEvent.type(ui.getByLabelText('Site'), 'My Blog');
    await userEvent.click(ui.getByRole('tab', { name: 'iMessage' }));
    expect(ui.getByText('example.com')).toBeTruthy();
  });

  test('copy writes the absolute URL and says so', async () => {
    const writeText = installClipboardMock();
    const ui = await renderHome();

    await userEvent.click(ui.getByRole('button', { name: /^Copy/ }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = new URL(writeText.mock.calls[0]?.[0] as string);
    expect(copied.origin).toBe('https://example.com');
    expect(copied.pathname).toBe('/api/og');
    expect(copied.searchParams.get('title')).toBe('Interstellar');
    expect(ui.getByRole('status').textContent).toBe('Copied');
  });

  test('number keys switch themes outside of inputs', async () => {
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: '2' });
    expect(checkedTheme(ui)).toBe('Modern');

    fireEvent.keyDown(window, { key: '4' });
    expect(checkedTheme(ui)).toBe('Swiss');

    fireEvent.keyDown(window, { key: '9' });
    expect(checkedTheme(ui)).toBe('Swiss');

    ui.getByLabelText('Site').focus();
    fireEvent.keyDown(window, { key: '1' });
    expect(checkedTheme(ui)).toBe('Swiss');
  });

  test('/ focuses the title input', async () => {
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: '/' });

    expect(document.activeElement).toBe(ui.getByLabelText('Title'));
  });

  test('? opens the shortcuts dialog and Escape closes it', async () => {
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: '?' });
    await waitFor(() => expect(ui.getByText('Keyboard shortcuts')).toBeTruthy());

    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(ui.queryByText('Keyboard shortcuts')).toBeNull());
  });

  test('Ctrl+Enter refreshes and Ctrl+Shift+C copies', async () => {
    const nowSpy = spyOn(Date, 'now').mockReturnValue(1700000001234);
    const writeText = installClipboardMock();
    const ui = await renderHome();

    fireEvent.keyDown(window, { key: 'Enter', ctrlKey: true });
    expect(previewParams(ui).get('t')).toBe('1700000001234');

    fireEvent.keyDown(window, { key: 'c', ctrlKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));

    nowSpy.mockRestore();
  });
});
