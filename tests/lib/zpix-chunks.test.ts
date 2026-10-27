import { describe, expect, test } from 'bun:test';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ZPIX_CHUNKS } from '../../app/lib/zpix-chunks';

describe('zpix chunk manifest', () => {
  test('every chunk file exists under public/', () => {
    for (const chunk of ZPIX_CHUNKS) {
      expect(existsSync(join(process.cwd(), 'public', chunk.file))).toBeTrue();
    }
  });

  test('no character is claimed by two chunks', () => {
    const seen = new Set<string>();
    for (const chunk of ZPIX_CHUNKS) {
      for (const char of chunk.chars) {
        expect(seen.has(char)).toBeFalse();
        seen.add(char);
      }
    }
  });

  test('chunk 0 is the Latin base and holds all printable ASCII', () => {
    for (let codePoint = 0x20; codePoint < 0x7f; codePoint += 1) {
      expect(ZPIX_CHUNKS[0].chars.includes(String.fromCharCode(codePoint))).toBeTrue();
    }
    expect(ZPIX_CHUNKS[0].chars).not.toContain('的');
  });

  test('common CJK punctuation, kana and Han share the first CJK chunk', () => {
    const cjkHead = ZPIX_CHUNKS.findIndex(chunk => chunk.chars.includes('的'));
    for (const char of '，。：、あア一是中') {
      expect(ZPIX_CHUNKS[cjkHead].chars).toContain(char);
    }
  });
});
