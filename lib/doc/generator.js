/*
  Automatically generates doc/commands.md based on Stripes-CLI help output
*/
import fs from 'fs';

import path from 'path';
import getLogger from '../cli/logger.js';
import { gatherCommands } from './yargs-help-parser.js';
import { generateToc, generateMarkdown } from './commands-to-markdown.js';

const { version } = fs.readJsonSync('../../package.json', { throws: false });

const logger = getLogger('docs');

const scriptPath = path.join(import.meta.dirname, '..', 'stripes-cli.js');
const docPath = path.join(import.meta.dirname, '..', '..', 'doc');
const templatePath = path.join(docPath, 'commands-template.md');
const outputPath = path.join(docPath, 'commands.md');


console.log('Generating Stripes-CLI command reference...');
const allCommands = gatherCommands('stripes', scriptPath);
const commandToc = generateToc(allCommands);
const commandHelp = generateMarkdown(allCommands);

logger.log(`loading template from ${templatePath}`);
const template = fs.readFileSync(templatePath, 'utf-8');

const help = template
  .replace('<%= version %>', version)
  .replace('<%= toc %>', commandToc)
  .replace('<%= commands %>', commandHelp)
  .replace(/ +$/gm, ''); // remove trailing spaces from final document

logger.log(`writing markdown to ${outputPath}`);
fs.writeFileSync(outputPath, help);

logger.log('done');
console.log(`Command reference generated: ${outputPath}`);
