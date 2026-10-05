#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';
import {
  formatConfig,
  generateStructure,
  getTemplate,
  listTemplates,
  parseServerConfig,
  validateServerConfig,
} from '../index.js';

const version = '0.1.0';
const help = `Discord Server Toolkit (dst)

Usage: dst <command> [file]

Commands:
  init [file]                 Write a starter community configuration
  validate <file|->           Validate a JSON configuration
  inspect <file|->            Show validation results and a structure preview
  generate <file|-> [--json] Generate an ASCII structure or normalized JSON
  format <file|->             Print normalized JSON (writes file unless input is -)
  template list               List starter templates
  template use <name> [file] Write a template (or stdout when file is omitted)

Options:
  --help, -h                  Show this help
  --version, -v               Show version
`;
type ReadResult = { raw: string; label: string };
async function readInput(file: string): Promise<ReadResult> {
  return file === '-'
    ? { raw: await readStdin(), label: 'stdin' }
    : { raw: await readFile(file, 'utf8'), label: basename(file) };
}
async function readJson(file: string): Promise<unknown> {
  const { raw, label } = await readInput(file);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`Could not parse ${label}: invalid JSON.`);
  }
}
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
function printFindings(result: ReturnType<typeof validateServerConfig>): void {
  for (const finding of [
    ...result.errors,
    ...result.warnings,
    ...result.info,
    ...result.suggestions,
  ])
    console.log(`${finding.severity.toUpperCase()} [${finding.code}] ${finding.message}`);
}
function fail(message: string): never {
  console.error(`dst: ${message}`);
  process.exitCode = 1;
  throw new Error('__DST_EXIT__');
}
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (!args.length || args.includes('--help') || args.includes('-h')) {
    console.log(help);
    return;
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(version);
    return;
  }
  const [command, ...rest] = args;
  if (command === 'template') {
    if (rest[0] === 'list') {
      console.log(listTemplates().join('\n'));
      return;
    }
    if (rest[0] === 'use' && rest[1]) {
      const config = getTemplate(rest[1]);
      if (!config) fail(`Unknown template "${rest[1]}". Try: ${listTemplates().join(', ')}.`);
      const content = formatConfig(config);
      if (rest[2]) {
        await writeFile(rest[2], content, { encoding: 'utf8', flag: 'wx' });
        console.log(`Wrote ${rest[2]}.`);
      } else process.stdout.write(content);
      return;
    }
    fail('Usage: dst template list | dst template use <name> [file]');
  }
  if (command === 'init') {
    const target = rest[0] ?? 'server.json';
    const config = getTemplate('community');
    if (!config) fail('Bundled community template is unavailable.');
    await writeFile(target, formatConfig(config), { encoding: 'utf8', flag: 'wx' });
    console.log(`Created ${target}.`);
    return;
  }
  const file = rest.find((arg) => !arg.startsWith('--'));
  if (!file) fail(`Usage: dst ${command} <file|->`);
  const raw = await readJson(file);
  const validation = validateServerConfig(raw);
  if (command === 'validate') {
    printFindings(validation);
    if (validation.valid) console.log('VALID');
    else process.exitCode = 1;
    return;
  }
  let config: ReturnType<typeof parseServerConfig>;
  try {
    config = parseServerConfig(raw);
  } catch (error) {
    fail(error instanceof Error ? error.message : 'Invalid configuration.');
  }
  if (command === 'inspect') {
    printFindings(validation);
    console.log(`\n${generateStructure(config)}`);
    if (!validation.valid) process.exitCode = 1;
    return;
  }
  if (command === 'generate') {
    if (!validation.valid) {
      printFindings(validation);
      process.exitCode = 1;
      return;
    }
    process.stdout.write(
      rest.includes('--json') ? formatConfig(config) : `${generateStructure(config)}\n`,
    );
    return;
  }
  if (command === 'format') {
    const formatted = formatConfig(config);
    if (file === '-') process.stdout.write(formatted);
    else {
      await writeFile(file, formatted);
      console.log(`Formatted ${file}.`);
    }
    return;
  }
  fail(`Unknown command "${command}". Run dst --help.`);
}
main().catch((error: unknown) => {
  if (error instanceof Error && error.message === '__DST_EXIT__') return;
  console.error(`dst: ${error instanceof Error ? error.message : 'unexpected error'}`);
  process.exitCode = 1;
});
