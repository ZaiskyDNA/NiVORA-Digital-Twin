import { describe, expect, it } from 'vitest';
import css from '../tokens.css?raw';
import { COLOR, cssVarOf, type ColorToken } from '../tokens';

describe('mirror token warna', () => {
  it.each(Object.keys(COLOR) as ColorToken[])('%s sama dengan tokens.css', (key) => {
    const match = new RegExp(`${cssVarOf(key)}:\\s*(#[0-9a-fA-F]{6})`).exec(css);
    expect(match?.[1]?.toLowerCase()).toBe(COLOR[key]);
  });
});
