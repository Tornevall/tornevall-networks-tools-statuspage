import { describe, expect, it } from 'vitest';
import { resolvePathSlug } from './config';

describe('resolvePathSlug', () => {
  it('uses a valid slug below the configured status path', () => {
    expect(resolvePathSlug('/status/example-company', '/status')).toBe('example-company');
    expect(resolvePathSlug('/status/example-company/', '/status/')).toBe('example-company');
  });

  it('does not override the configured slug on the status root', () => {
    expect(resolvePathSlug('/status', '/status')).toBe('');
    expect(resolvePathSlug('/status/', '/status')).toBe('');
  });

  it('rejects nested and malformed path content', () => {
    expect(resolvePathSlug('/status/example-company/private', '/status')).toBe('');
    expect(resolvePathSlug('/status/Example', '/status')).toBe('');
    expect(resolvePathSlug('/status/example_company', '/status')).toBe('');
    expect(resolvePathSlug('/status/%2Fetc', '/status')).toBe('');
  });

  it('remains disabled when no path prefix is configured', () => {
    expect(resolvePathSlug('/status/example-company', null)).toBe('');
    expect(resolvePathSlug('/status/example-company', '')).toBe('');
  });
});
