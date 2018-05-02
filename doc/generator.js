/*
  Generates basic Stripes CLI command documentation in markdown using Yargs --help output.
  The output serves as good starting point for command documentation.
  Suitable headings must be added/edited to match desired placement in document structure.

  To use, pipe the output of a command's help to this generator:
    stripes build --help | node doc/generator
*/

const getStdin = require('get-stdin');

function parseOption(data) {
  if (!data && data.length > 1) {
    return null;
  }
  const option = {
    name: data[1],
    description: '',
    type: '',
    default: '',
  };

  // Filter out these options applied to all commands
  if (option.name === '--help' || option.name === '--version' || option.name === '--interactive') {
    return null;
  }

  if (data.length > 2) {
    const descriptionMatch = data[2].match(/^[^[]*/);
    const typeMatch = data[2].match(/\[(\w*)]/);
    const defaultMatch = data[2].match(/\[default: (\w*)]/);
    const choicesMatch = data[2].match(/\[choices: ([^\]]*)]/);
    const requiredMatch = data[2].match(/\[required\]/);

    if (descriptionMatch) {
      option.description = descriptionMatch[0].trim();
    }
    if (typeMatch) {
      option.type = typeMatch[1].trim();
    }
    if (defaultMatch) {
      option.default = defaultMatch[1].trim();
    }
    if (choicesMatch) {
      option.choices = choicesMatch[1].trim();
    }
    if (requiredMatch) {
      option.required = true;
    }
  }
  return option;
}


function getOptions(group) {
  const optionRegex = /^\s+([\w-]*)\b\s*\b(.*)$/gm;

  let optionRows = '';
  let optionMatch;
  while (optionMatch !== null) {
    optionMatch = optionRegex.exec(group);
    if (optionMatch && optionMatch.length) {
      const option = parseOption(optionMatch);
      if (option) {
        optionRows += `\`${option.name}\` | ${option.description} | ${option.type} | `;
        if (option.required) {
          optionRows += '(*) ';
        }
        if (option.default) {
          optionRows += `default: ${option.default} `;
        }
        if (option.choices) {
          optionRows += `choices: ${option.choices}`;
        }
        optionRows += '\n';
      }
    }
  }
  return optionRows;
}

function getOptionTable(input, isPositional) {
  const groupRegex = isPositional ? /Positionals:([\s\S]*?)^$/gm : /Options:([\s\S]*?)^$/gm;
  const groups = input.match(groupRegex);
  let optionsTable = '';
  if (groups && groups.length) {
    optionsTable += `${isPositional ? 'Positional' : 'Option'} | Description | Type | Notes\n`;
    optionsTable += '---|---|---|---\n';
    groups.forEach((group) => {
      optionsTable += getOptions(group);
    });
  }
  return optionsTable;
}

function getExampleSection(input) {
  const groupRegex = /Examples:([\s\S]*)$/m;
  const match = input.match(groupRegex);
  let exampleSection = '';
  if (match) {
    exampleSection += 'Examples:\n\n';
    const exampleRegex = /^\s+(.*?)\s{2,}\b(.*)$/gm;
    let exampleMatch;
    while (exampleMatch !== null) {
      exampleMatch = exampleRegex.exec(match[0]);
      if (exampleMatch && exampleMatch.length > 1) {
        if (exampleMatch.length > 2) {
          exampleSection += `${exampleMatch[2]}:\n`;
        }
        exampleSection += '```\n';
        exampleSection += `${exampleMatch[1]}\n`;
        exampleSection += '```\n';
      }
    }
  }
  return exampleSection;
}

function getSubCommandsSection(input) {
  const groupRegex = /Commands:([\s\S]*?)^$/m;
  const match = input.match(groupRegex);
  let section = '';
  if (match) {
    section += 'Sub-commands:\n';
    const cmdRegex = /^\s+(stripes.*?)\s{2,}\b(.*)$/gm;
    let cmdMatch;
    while (cmdMatch !== null) {
      cmdMatch = cmdRegex.exec(match[0]);
      if (cmdMatch) {
        section += `* \`${cmdMatch[1]}\`\n`;
      }
    }
  }
  return section;
}

function getCommandSummary(input) {
  const commandRegex = /(stripes\s.*)\n\n\b(.*)\n/;
  let commandSummary = '';
  const match = input.match(commandRegex);
  if (match) {
    commandSummary += `${match[2]}\n\n`;
    commandSummary += 'Usage:\n```\n';
    commandSummary += `${match[1]}\n`;
    commandSummary += '```\n';
  }
  return commandSummary;
}

getStdin().then((input) => {
  let doc = '';
  doc += getCommandSummary(input);
  doc += '\n';
  doc += getSubCommandsSection(input);
  doc += '\n';
  doc += getOptionTable(input, true);
  doc += '\n\n';
  doc += getOptionTable(input);
  doc += '\n\n';
  doc += getExampleSection(input);
  console.log(doc);
});
