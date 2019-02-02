/*
  Generates CLI command reference in markdown format using command data obtained from yargs-help-parser
*/

const logger = require('../cli/logger')('docs');


// Exclude these commands from the markdown
const skipCommands = [
  'stripes',            // root not needed
  'stripes new',        // deprecated
  'stripes completion', // internal to yargs, does not render help
];

// Exclude these options that apply to all commands
const skipOptions = [
  '--help',
  '--version',
  '--interactive',
];

// Returns command in the document
function commandTitle(command) {
  const wip = '(work in progress)';
  return `\`${command.name}\` command${command.description.includes(wip) ? ` ${wip}` : ''}`;
}

// Returns link to a command in the document
function markdownCommandLink(command, displayName) {
  return `[${displayName}](#${commandTitle(command).replace(/[`()]/g, '').replace(/\s/g, '-')})`;
}

// Returns a command heading prefixed with appropriate number of '#'
function markdownCommandSummary(command, depth) {
  let level = depth;
  let headingLevel = '#';
  while (level--) {
    headingLevel += '#';
  }
  let summary = `\n${headingLevel} ${commandTitle(command)}\n\n`;
  summary += `${command.description}\n\n`;
  summary += 'Usage:\n```\n';
  summary += `$ ${command.usage}\n`;
  summary += '```\n';
  return summary;
}

// Returns bulleted list of sub-commands with links
function markdownSubCommands(subCommands) {
  if (!subCommands.length) {
    return '';
  }
  let section = 'Sub-commands:\n';
  subCommands.forEach(sub => {
    const displayName = `\`${sub.fullName}\``;
    section += `* ${markdownCommandLink(sub, displayName)}\n`;
  });
  return section;
}

// Comparison function for sorting options by name
function sortByName(a, b) {
  const aName = a.name.toUpperCase();
  const bName = b.name.toUpperCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return 0;
}

// Returns formatted table of options (also used for positionals)
function markdownOptionTable(displayName, optionsData) {
  const options = optionsData.filter(opt => !skipOptions.includes(opt.name));
  if (!options.length) {
    return '';
  }
  let optionsTable = `${displayName} | Description | Type | Notes\n`;
  optionsTable += '---|---|---|---\n';
  options.sort(sortByName).forEach((option) => {
    const description = option.stdin ? option.description.replace('(stdin)', '') : option.description;
    const notes = [
      option.required ? 'required' : '',
      option.default ? `default: ${option.default}` : '',
      option.choices ? `choices: ${option.choices}` : '',
      option.stdin ? 'supports stdin' : '',
    ];
    optionsTable += `\`${option.name}\` | ${description} | ${option.type} | ${notes.filter(note => note.length > 0).join('; ')}\n`;
  });
  return optionsTable;
}

// Returns code blocks for command's "Examples:" section
function markdownExamples(examples) {
  if (!examples.length) {
    return '';
  }
  let exampleSection = 'Examples:\n\n';
  examples.forEach((example) => {
    exampleSection += `${example.description}:\n`;
    exampleSection += '```\n';
    exampleSection += `$ ${example.usage}\n`;
    exampleSection += '```\n';
  });
  return exampleSection;
}

// Defines overall structure and returns markdown for a single command
function markdownCommand(command, depth) {
  logger.log(`generate markdown for ${command.name}`);
  const sections = [
    markdownCommandSummary(command, depth),
    markdownSubCommands(command.subCommands),
    markdownOptionTable('Positional', command.positionals),
    markdownOptionTable('Option', command.options),
    markdownExamples(command.examples),
  ];
  return sections.filter(section => section.length > 0).join('\n');
}

// Recursively returns markdown for all commands in the tree
function generateMarkdown(command, depth = 1) {
  const skip = skipCommands.includes(command.fullName);
  let markdown = skip ? '' : markdownCommand(command, depth);
  command.subCommands.forEach(subCommand => {
    markdown += generateMarkdown(subCommand, skip ? depth : depth + 1);
  });
  return markdown;
}

// Recursively returns markdown TOC for all commands in the tree
function generateToc(command, depth = 0) {
  const skip = skipCommands.includes(command.fullName);
  let level = depth;
  let tocIndent = '';
  while (level--) {
    tocIndent += '    ';
  }
  const displayName = commandTitle(command);
  let toc = skip ? '' : `${tocIndent}* ${markdownCommandLink(command, displayName)}\n`;
  command.subCommands.forEach(subCommand => {
    toc += generateToc(subCommand, skip ? depth : depth + 1);
  });
  return toc;
}

module.exports = {
  generateToc: (command) => generateToc(command).trim(),
  generateMarkdown,
};
