import { channelTypes, type ServerConfig } from '../config/types.js';
import { dangerousPermissions, permissionSet } from '../permissions/index.js';

export type Severity = 'error' | 'warning' | 'info' | 'suggestion';
export interface Finding {
  code: string;
  message: string;
  path?: string;
  severity: Severity;
}
export interface ValidationResult {
  valid: boolean;
  errors: Finding[];
  warnings: Finding[];
  info: Finding[];
  suggestions: Finding[];
}

function result(): ValidationResult {
  return { valid: true, errors: [], warnings: [], info: [], suggestions: [] };
}
function add(output: ValidationResult, finding: Finding): void {
  const buckets: Record<Severity, keyof Omit<ValidationResult, 'valid'>> = {
    error: 'errors',
    warning: 'warnings',
    info: 'info',
    suggestion: 'suggestions',
  };
  output[buckets[finding.severity]].push(finding);
  if (finding.severity === 'error') output.valid = false;
}
function array(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !array(value);
}

export function parseServerConfig(input: unknown): ServerConfig {
  if (!object(input)) throw new Error('Configuration must be a JSON object.');
  const config = input as Record<string, unknown>;
  if (
    !config.server ||
    typeof config.server !== 'object' ||
    array(config.server) ||
    typeof (config.server as Record<string, unknown>).name !== 'string'
  )
    throw new Error('server.name must be a string.');
  for (const key of ['roles', 'categories', 'channels'])
    if (!array(config[key])) throw new Error(`${key} must be an array.`);
  if (
    !(config.roles as unknown[]).every(
      (role) =>
        object(role) &&
        typeof role.name === 'string' &&
        typeof role.position === 'number' &&
        (!('permissions' in role) ||
          (array(role.permissions) &&
            role.permissions.every((permission) => typeof permission === 'string'))),
    )
  )
    throw new Error(
      'Every role needs a string name, numeric position, and optional string permissions.',
    );
  if (
    !(config.categories as unknown[]).every(
      (category) => object(category) && typeof category.name === 'string',
    )
  )
    throw new Error('Every category needs a string name.');
  if (
    !(config.channels as unknown[]).every(
      (channel) =>
        object(channel) &&
        typeof channel.name === 'string' &&
        typeof channel.type === 'string' &&
        (!('overwrites' in channel) ||
          (array(channel.overwrites) &&
            channel.overwrites.every(
              (overwrite) =>
                object(overwrite) &&
                typeof overwrite.target === 'string' &&
                (!('allow' in overwrite) ||
                  (array(overwrite.allow) &&
                    overwrite.allow.every((permission) => typeof permission === 'string'))) &&
                (!('deny' in overwrite) ||
                  (array(overwrite.deny) &&
                    overwrite.deny.every((permission) => typeof permission === 'string'))),
            ))),
    )
  )
    throw new Error('Every channel needs string name/type and valid optional overwrites.');
  return input as unknown as ServerConfig;
}

export function validateServerConfig(input: unknown): ValidationResult {
  const output = result();
  let config: ServerConfig;
  try {
    config = parseServerConfig(input);
  } catch (error) {
    add(output, {
      severity: 'error',
      code: 'INVALID_SCHEMA',
      message: error instanceof Error ? error.message : 'Invalid configuration.',
    });
    return output;
  }
  if (!config.server.name.trim() || config.server.name.length > 100)
    add(output, {
      severity: 'error',
      code: 'INVALID_SERVER_NAME',
      message: 'server.name must be 1–100 characters.',
      path: 'server.name',
    });
  const categoryNames = new Set<string>();
  config.categories.forEach((category, i) => {
    if (!category.name?.trim())
      add(output, {
        severity: 'error',
        code: 'INVALID_CATEGORY',
        message: 'Category name is required.',
        path: `categories[${i}].name`,
      });
    if (categoryNames.has(category.name))
      add(output, {
        severity: 'warning',
        code: 'DUPLICATE_CATEGORY',
        message: `Duplicate category name: ${category.name}.`,
      });
    categoryNames.add(category.name);
  });
  const positions = new Map<number, string>();
  const roleNames = new Set<string>();
  config.roles.forEach((role, i) => {
    const path = `roles[${i}]`;
    if (!role.name?.trim())
      add(output, {
        severity: 'error',
        code: 'INVALID_ROLE',
        message: 'Role name is required.',
        path,
      });
    if (!Number.isInteger(role.position) || role.position < 0)
      add(output, {
        severity: 'error',
        code: 'INVALID_ROLE_POSITION',
        message: `Role ${role.name} needs a non-negative integer position.`,
        path: `${path}.position`,
      });
    if (positions.has(role.position))
      add(output, {
        severity: 'error',
        code: 'DUPLICATE_ROLE_POSITION',
        message: `Roles ${positions.get(role.position)} and ${role.name} share position ${role.position}.`,
      });
    positions.set(role.position, role.name);
    if (roleNames.has(role.name))
      add(output, {
        severity: 'warning',
        code: 'DUPLICATE_ROLE_NAME',
        message: `Duplicate role name: ${role.name}.`,
      });
    roleNames.add(role.name);
    const rolePermissions = role.permissions ?? [];
    rolePermissions.forEach((permission) => {
      if (!permissionSet.has(permission))
        add(output, {
          severity: 'error',
          code: 'UNKNOWN_PERMISSION',
          message: `Unknown permission ${permission} on role ${role.name}.`,
          path: `${path}.permissions`,
        });
    });
    if (role.name === '@everyone') {
      for (const permission of rolePermissions)
        if (dangerousPermissions.has(permission))
          add(output, {
            severity: 'warning',
            code: 'EVERYONE_DANGEROUS_PERMISSION',
            message: `@everyone has dangerous permission ${permission}.`,
            path,
          });
    }
    if (rolePermissions.includes('ADMINISTRATOR'))
      add(output, {
        severity: 'warning',
        code: 'ADMINISTRATOR_ACCESS',
        message: `${role.name} has ADMINISTRATOR; channel overwrites cannot restrict it.`,
        path,
      });
    for (const permission of ['MANAGE_CHANNELS', 'MANAGE_ROLES', 'MANAGE_WEBHOOKS'])
      if (rolePermissions.includes(permission) && role.name.toLowerCase().includes('member'))
        add(output, {
          severity: 'warning',
          code: 'ELEVATED_MEMBER_PERMISSION',
          message: `${role.name} can ${permission.toLowerCase().replaceAll('_', ' ')}.`,
          path,
        });
  });
  const channelNames = new Set<string>();
  config.channels.forEach((channel, i) => {
    const path = `channels[${i}]`;
    if (!channel.name?.trim() || !/^[a-z0-9-_ ]+$/i.test(channel.name))
      add(output, {
        severity: 'error',
        code: 'INVALID_CHANNEL_NAME',
        message: `Channel ${channel.name || '(unnamed)'} has an invalid name.`,
        path: `${path}.name`,
      });
    if (!channelTypes.includes(channel.type))
      add(output, {
        severity: 'error',
        code: 'INVALID_CHANNEL_TYPE',
        message: `Unsupported channel type ${String(channel.type)}.`,
        path: `${path}.type`,
      });
    if (channel.category && !categoryNames.has(channel.category))
      add(output, {
        severity: 'error',
        code: 'UNKNOWN_CATEGORY',
        message: `Channel ${channel.name} references unknown category ${channel.category}.`,
        path: `${path}.category`,
      });
    const scopedName = `${channel.category ?? ''}/${channel.name}`;
    if (channelNames.has(scopedName))
      add(output, {
        severity: 'warning',
        code: 'DUPLICATE_CHANNEL',
        message: `Duplicate channel ${channel.name} in the same category.`,
      });
    channelNames.add(scopedName);
    channel.overwrites?.forEach((overwrite, j) => {
      const allow = new Set(overwrite.allow ?? []);
      const deny = new Set(overwrite.deny ?? []);
      for (const permission of [...allow, ...deny])
        if (!permissionSet.has(permission))
          add(output, {
            severity: 'error',
            code: 'UNKNOWN_OVERWRITE_PERMISSION',
            message: `Unknown overwrite permission ${permission} on ${channel.name}.`,
            path: `${path}.overwrites[${j}]`,
          });
      for (const permission of allow)
        if (deny.has(permission))
          add(output, {
            severity: 'warning',
            code: 'CONFLICTING_OVERWRITE',
            message: `${channel.name} both allows and denies ${permission} for ${overwrite.target}.`,
            path: `${path}.overwrites[${j}]`,
          });
    });
    const everyone = channel.overwrites?.find((overwrite) => overwrite.target === '@everyone');
    if (channel.type === 'announcement' && !everyone?.deny?.includes('SEND_MESSAGES'))
      add(output, {
        severity: 'warning',
        code: 'ANNOUNCEMENT_WRITABLE',
        message: `@everyone can send messages in #${channel.name}. Recommended: deny SEND_MESSAGES for @everyone.`,
        path,
      });
  });
  if (!config.roles.some((role) => role.name === '@everyone'))
    add(output, {
      severity: 'suggestion',
      code: 'MISSING_EVERYONE',
      message: 'Declare @everyone to make baseline permissions explicit.',
    });
  if (!config.moderation)
    add(output, {
      severity: 'suggestion',
      code: 'MISSING_MODERATION',
      message: 'Add moderation settings to document verification and content-filter choices.',
    });
  return output;
}
