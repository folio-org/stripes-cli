/*
  Automatically generates doc/commands.md based on Stripes-CLI help output
*/
const fs = require('fs');
const path = require('path');
const { version } = require('../../package');
const logger = require('../cli/logger')('docs');
const { gatherCommands } = require('./yargs-help-parser');
const { generateToc, generateMarkdown } = require('./commands-to-markdown');

const scriptPath = path.join(__dirname, '..', 'stripes-cli.js');
const docPath = path.join(__dirname, '..', '..', 'doc');
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
