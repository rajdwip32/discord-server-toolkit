import type { ServerConfig } from '../config/types.js';

export function generateStructure(config: ServerConfig): string {
  const lines = [config.server.name, '│'];
  const categories = config.categories.map((category) => category.name);
  const groups = [
    ...categories,
    ...(config.channels.some((channel) => !channel.category) ? ['Uncategorized'] : []),
  ];
  groups.forEach((category, index) => {
    const lastGroup = index === groups.length - 1;
    const branch = lastGroup ? '└──' : '├──';
    lines.push(`${branch} ${category.toUpperCase()}`);
    const channels = config.channels.filter((channel) =>
      category === 'Uncategorized' ? !channel.category : channel.category === category,
    );
    channels.forEach((channel, channelIndex) => {
      const lastChannel = channelIndex === channels.length - 1;
      lines.push(`${lastGroup ? '    ' : '│   '}${lastChannel ? '└──' : '├──'} ${channel.name}`);
    });
    if (!lastGroup) lines.push('│');
  });
  return lines.join('\n');
}

export function formatConfig(config: ServerConfig): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}
