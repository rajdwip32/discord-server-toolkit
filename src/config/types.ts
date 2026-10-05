export const channelTypes = ['text', 'announcement', 'forum', 'voice', 'stage'] as const;
export type ChannelType = (typeof channelTypes)[number];

export interface PermissionOverwrite {
  target: string;
  allow?: string[];
  deny?: string[];
}

export interface RoleConfig {
  id?: string;
  name: string;
  position: number;
  permissions?: string[];
  managed?: boolean;
}

export interface CategoryConfig {
  id?: string;
  name: string;
  position?: number;
}

export interface ChannelConfig {
  id?: string;
  name: string;
  type: ChannelType;
  category?: string;
  position?: number;
  overwrites?: PermissionOverwrite[];
  topic?: string;
  nsfw?: boolean;
}

export interface ModerationConfig {
  verificationLevel?: 'none' | 'low' | 'medium' | 'high' | 'highest';
  explicitContentFilter?: 'disabled' | 'members_without_roles' | 'all_members';
}

export interface ServerConfig {
  server: { name: string; description?: string; community?: boolean };
  roles: RoleConfig[];
  categories: CategoryConfig[];
  channels: ChannelConfig[];
  moderation?: ModerationConfig;
}
