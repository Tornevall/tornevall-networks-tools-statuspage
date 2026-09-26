import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/styles.css'), 'utf8');

describe('statuspage color theme', () => {
  it('separates page and surface colors', () => {
    expect(styles).toContain('--page-bg: #f4f6f9;');
    expect(styles).toContain('--page-text: #172033;');
    expect(styles).toContain('--surface-text: #172033;');
    expect(styles).toContain('--surface-muted: #5b6678;');
    expect(styles).toContain('color: var(--surface-text);');
  });

  it('keeps status colors on scoped indicators instead of whole surfaces', () => {
    expect(styles).toContain('.overall-card.overall-status-degraded');
    expect(styles).toContain('border-left-color: var(--warning);');
    expect(styles).toContain('--service-row-bg: #f8fafc;');
    expect(styles).toContain('background: var(--service-row-bg);');
    expect(styles).toContain('.statuspage-status-degraded');
    expect(styles).not.toContain('.status-degraded, .status-partial_outage');
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
