# Discord Server Toolkit

An open-source toolkit for designing, validating, and generating secure Discord server structures. It runs locally, needs no bot token, and does not collect data.

## Why

Discord permissions are easy to misconfigure. This project makes the intended structure and access rules reviewable as JSON before you create or change a server.

## Features

- Strict, reusable TypeScript validation API: `validateServerConfig(config)`
- Permission and overwrite checks for risky access, conflicts, and unknown permissions
- Readable ASCII structure and normalized JSON generation
- Small CLI with stdin support and five original starter templates
- No Discord API connection, account, analytics, cookies, or server API

## Install

```bash
npm install
npm run build
npm link
dst --help
```

For local development without linking, use `npm run dev -- validate examples/community.json`.

## Quick start

```bash
dst template use community server.json
dst validate server.json
dst generate server.json
```

## CLI

| Command                          | Purpose                            |
| -------------------------------- | ---------------------------------- |
| `dst init [file]`                | Create a community starter config. |
| `dst validate <file              | ->`                                | Validate JSON and report findings.    |
| `dst inspect <file               | ->`                                | Validate and preview structure.       |
| `dst generate <file              | -> [--json]`                       | Print a structure or normalized JSON. |
| `dst format <file                | ->`                                | Format a configuration.               |
| `dst template list`              | List templates.                    |
| `dst template use <name> [file]` | Print or write a template.         |

## Configuration

See [examples/community.json](examples/community.json). Configurations define a server, roles, categories, channels, channel overwrites, and optional moderation settings. Channels support `text`, `announcement`, `forum`, `voice`, and `stage` types.

The validator returns `{ valid, errors, warnings, info, suggestions }`; it never changes a configuration. It checks JSON shape, roles and positions, known permissions, privileged `@everyone` access, announcement write access, categories, channel names, duplicate channels, and conflicting overwrites. It is a planning aid—not a replacement for reviewing Discord's current permission behavior before deployment.

## Templates

`community`, `gaming`, `creator`, `support`, and `private` are bundled. Templates are local, original starter configurations.

## Development and testing

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run audit
```

For performance testing, use a production build and measure representative CLI runs on constrained hardware. This release has no web interface, network service, or Lighthouse target.

## Security

Never put Discord tokens in configuration files. Input is parsed as JSON and validation reports unrecognized permissions and malformed structures. File paths are provided directly by the user; the CLI does not execute configuration content. See [SECURITY.md](SECURITY.md).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Please include tests for behavioral changes.

## Roadmap

- More Discord setting coverage
- Config migration helpers
- Optional browser editor, kept separate from the core library

## License

[MIT](LICENSE).
