import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'node:url';

// ESM replacement for yargs.commandDir(): imports each command module in a directory
// (non-recursive) and returns them, ready to be passed to yargs.command().
// The optional `visit` function can modify a command before it is returned.
export default async function loadCommands(dir, { visit } = {}) {
  const commands = [];
  const filenames = fs.readdirSync(dir).filter(filename => filename.endsWith('.js')).sort();

  for (const filename of filenames) { // eslint-disable-line no-restricted-syntax
    const filePath = path.join(dir, filename);
    const { default: command } = await import(pathToFileURL(filePath)); // eslint-disable-line no-await-in-loop

    // Skip helper modules that are not commands, e.g. common-options.js
    if (command?.command) {
      commands.push(visit ? visit(command, filePath, filename) : command);
    }
  }
  return commands;
}
