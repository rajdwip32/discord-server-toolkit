import type { ServerConfig } from '../config/types.js';

const base = (name: string): ServerConfig => ({
  server: { name, community: true },
  roles: [
    { name: '@everyone', position: 0, permissions: ['VIEW_CHANNEL'] },
    {
      name: 'Moderator',
      position: 10,
      permissions: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'BAN_MEMBERS'],
    },
  ],
  categories: [],
  channels: [],
  moderation: { verificationLevel: 'medium', explicitContentFilter: 'all_members' },
});
export const templates: Record<string, ServerConfig> = {
  community: {
    ...base('Community Server'),
    categories: [{ name: 'Information' }, { name: 'Community' }, { name: 'Voice' }],
    channels: [
      { name: 'welcome', type: 'text', category: 'Information' },
      { name: 'rules', type: 'text', category: 'Information' },
      {
        name: 'announcements',
        type: 'announcement',
        category: 'Information',
        overwrites: [{ target: '@everyone', deny: ['SEND_MESSAGES'] }],
      },
      { name: 'general', type: 'text', category: 'Community' },
      { name: 'General', type: 'voice', category: 'Voice' },
    ],
  },
  gaming: {
    ...base('Gaming Server'),
    categories: [{ name: 'Lobby' }, { name: 'Games' }, { name: 'Voice' }],
    channels: [
      { name: 'start-here', type: 'text', category: 'Lobby' },
      { name: 'looking-for-group', type: 'forum', category: 'Games' },
      { name: 'Party One', type: 'voice', category: 'Voice' },
    ],
  },
  creator: {
    ...base('Creator Community'),
    categories: [{ name: 'Updates' }, { name: 'Community' }],
    channels: [
      {
        name: 'announcements',
        type: 'announcement',
        category: 'Updates',
        overwrites: [{ target: '@everyone', deny: ['SEND_MESSAGES'] }],
      },
      { name: 'showcase', type: 'forum', category: 'Community' },
      { name: 'general', type: 'text', category: 'Community' },
    ],
  },
  support: {
    ...base('Support Server'),
    categories: [{ name: 'Support' }, { name: 'Resources' }],
    channels: [
      { name: 'help', type: 'forum', category: 'Support' },
      { name: 'reports', type: 'text', category: 'Support' },
      { name: 'guides', type: 'text', category: 'Resources' },
    ],
  },
  private: {
    ...base('Private Community'),
    server: { name: 'Private Community', community: false },
    categories: [{ name: 'Home' }],
    channels: [
      { name: 'general', type: 'text', category: 'Home' },
      { name: 'Lounge', type: 'voice', category: 'Home' },
    ],
  },
};
export function listTemplates(): string[] {
  return Object.keys(templates);
}
export function getTemplate(name: string): ServerConfig | undefined {
  const template = templates[name.toLowerCase()];
  return template ? structuredClone(template) : undefined;
}
