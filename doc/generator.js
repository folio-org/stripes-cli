/*
  Generates basic Stripes CLI commnad documentation in markdown using Yargs --help output.
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

    if (descriptionMatch) {
      option.description = descriptionMatch[0].trim();
    }
    if (typeMatch) {
      option.type = typeMatch[1].trim();
    }
    if (defaultMatch) {
      option.default = defaultMatch[1].trim();
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
        optionRows += `\`${option.name}\` | ${option.description} | ${option.type} | ${option.default}\n`;
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
    optionsTable += `${isPositional ? 'Positional' : 'Option'} | Description | Type | Default\n`;
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
    exampleSection += 'Examples:\n';
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

function getCommandSummary(input) {
  const commandRegex = /(stripes\s.*)\n\n\b(.*)\n/;
  let commandSummary = '';
  const match = input.match(commandRegex);
  if (match) {
    commandSummary += `\`${match[1]}\`\n`;
    commandSummary += `${match[2]}\n`;
  }
  return commandSummary;
}

getStdin().then((input) => {
  let doc = '';
  doc += getCommandSummary(input);
  doc += '\n';
  doc += getOptionTable(input, true);
  doc += '\n';
  doc += getOptionTable(input);
  doc += '\n';
  doc += getExampleSection(input);
  console.log(doc);
});
