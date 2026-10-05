import { describe, expect, it } from 'vitest';
import { generateStructure, getTemplate, validateServerConfig } from '../src/index.js';

describe('validation', () => {
  it('accepts the community template', () =>
    expect(validateServerConfig(getTemplate('community')).valid).toBe(true));
  it('rejects unknown permissions and duplicated positions', () => {
    const config = getTemplate('community')!;
    config.roles.push({ name: 'Duplicate', position: 10, permissions: ['FLY'] });
    const result = validateServerConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.map((item) => item.code)).toEqual(
      expect.arrayContaining(['UNKNOWN_PERMISSION', 'DUPLICATE_ROLE_POSITION']),
    );
  });
  it('warns when announcements are writable by everyone', () => {
    const config = getTemplate('community')!;
    const announcement = config.channels.find((channel) => channel.type === 'announcement')!;
    announcement.overwrites = [];
    expect(validateServerConfig(config).warnings.map((item) => item.code)).toContain(
      'ANNOUNCEMENT_WRITABLE',
    );
  });
});
describe('generator', () => {
  it('renders categories and channels', () => {
    const output = generateStructure(getTemplate('community')!);
    expect(output).toContain('INFORMATION');
    expect(output).toContain('announcements');
  });
});
