import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8');

describe('statuspage color theme', () => {
  it('separates page and surface colors', () => {
    expect(styles).toContain('--page-bg: #f4f6f9;');
    expect(styles).toContain('--page-text: #172033;');
    expect(styles).toContain('--surface-text: #172033;');
    expect(styles).toContain('--surface-muted: #5b6678;');
    expect(styles).toContain('color: var(--surface-text);');
  });

  it('keeps dark mode cards light with readable surface text', () => {
    const darkTheme = styles.split('@media (prefers-color-scheme: dark)')[1] ?? '';

    expect(darkTheme).toContain('--page-bg: #0f1520;');
    expect(darkTheme).toContain('--page-text: #edf2f7;');
    expect(darkTheme).toContain('--card-bg: #ffffff;');
    expect(darkTheme).toContain('--surface-text: #172033;');
    expect(darkTheme).toContain('--surface-muted: #5b6678;');
  });
});
