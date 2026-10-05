export const permissions = [
  'ADMINISTRATOR',
  'VIEW_CHANNEL',
  'SEND_MESSAGES',
  'MANAGE_CHANNELS',
  'MANAGE_ROLES',
  'MANAGE_WEBHOOKS',
  'MANAGE_MESSAGES',
  'KICK_MEMBERS',
  'BAN_MEMBERS',
  'MENTION_EVERYONE',
  'CONNECT',
  'SPEAK',
  'MODERATE_MEMBERS',
  'CREATE_PUBLIC_THREADS',
  'SEND_MESSAGES_IN_THREADS',
] as const;
export type Permission = (typeof permissions)[number];
export const permissionSet = new Set<string>(permissions);
export const dangerousPermissions = new Set<string>([
  'ADMINISTRATOR',
  'MANAGE_CHANNELS',
  'MANAGE_ROLES',
  'MANAGE_WEBHOOKS',
  'KICK_MEMBERS',
  'BAN_MEMBERS',
]);
