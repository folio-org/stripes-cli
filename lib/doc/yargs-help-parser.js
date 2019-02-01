/*
  Recursively parses Yargs command --help output to generate a command tree for use in generating a CLI command reference.
  This is currently specific to stripes-cli, but a future refactor could make it general purpose for other Yargs-based CLIs
*/
const childProcess = require('child_process');
const logger = require('../cli/logger')('docs');

// Captures command name, eg. "stripes foo bar" (match[1]), and description (match[2]) separated by two new-lines
const commandRegex = /(stripes\s.*)\n\n\b(.*)\n/;

// Captures content between "Commands:" and the next empty line
const subCommandGroupRegex = /Commands:([\s\S]*?)^$/gm;

// Captures content between "Options:" and the next empty line
const optionsGroupRegex = /Options:([\s\S]*?)^$/gm;

// Captures content between "Positionals:" and the next empty line
const positionalsGroupRegex = /Positionals:([\s\S]*?)^$/gm;

// Captures content between "Examples:" and the end
const exampleGroupRegex = /Examples:([\s\S]*)$/gm;

// Capture a single command in the "Commands:" section
// Positive lookahead (?=...) matches two or more spaces (preceding the description) or ' [' or ' <'
const subCommandRegex = /^(?:\s+)(stripes.*?)(?=\s{2,}|\s\[|\s<)/gm;

// Capture a single item in the "Options:", "Positionals:", or "Examples:" section
// Item name (match[1]) begins after space indent, description/details (match[2]) is separated by two or more spaces
const defaultItemRegex = /^\s+(.*?)[^\S\n]{2,}\b(.*)$/gm;


// Returns an object of option metadata gathered from a previously matched option line
function parseOption(optionMatch) {
  // match[1] is the option name
  // match[2] is the description and metadata in square brackets []
  if (!optionMatch && optionMatch.length > 1) {
    return null;
  }
  const option = {
    name: optionMatch[1],
    description: '',
    type: '',
    default: '',
  };

  if (optionMatch.length > 2) {
    const descriptionMatch = optionMatch[2].match(/^[^[]*/);           // Everything up to first '['
    const typeMatch = optionMatch[2].match(/\[(boolean|string|number|count|array)]/);
    const defaultMatch = optionMatch[2].match(/\[default: ([^\]]*)]/); // [default: value]
    const choicesMatch = optionMatch[2].match(/\[choices: ([^\]]*)]/); // [choices: "enable", "disable"]
    const requiredMatch = optionMatch[2].match(/\[required\]/);        // [required]
    const stdinMatch = optionMatch[2].match(/\(stdin\)/);              // (stdin)

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
    if (stdinMatch) {
      option.stdin = true;
    }
  }
  return option;
}

// Returns array of item data per matched group of text (commands, options, examples, etc.)
// itemRegex determines how to parse lines within group
// itemMap is a function to map item matches to an object
function parseGroup(helpText, groupRegex, itemRegex, itemMap) {
  const groupMatch = helpText.match(groupRegex);
  const items = [];
  if (groupMatch) {
    groupMatch.forEach((group) => {
      let itemMatch;
      while (itemMatch !== null) {
        itemMatch = itemRegex.exec(group);
        if (itemMatch && itemMatch.length > 1) {
          const itemData = itemMap(itemMatch);
          if (itemData) {
            items.push(itemData);
          }
        }
      }
    });
  }
  return items;
}

// Returns markdown command description with usage wrapped in a code block
function parseDescription(helpText) {
  const match = helpText.match(commandRegex);
  if (match) {
    return match[2];
  }
  return '';
}

// Returns markdown command description with usage wrapped in a code block
function parseUsage(helpText) {
  const match = helpText.match(commandRegex);
  if (match) {
    return match[1];
  }
  return '';
}

// Returns array of sub-commands
function parseSubCommands(helpText) {
  const parseCommand = match => match[1];
  return parseGroup(helpText, subCommandGroupRegex, subCommandRegex, parseCommand);
}

// Returns array of command options
function parseOptions(helpText) {
  return parseGroup(helpText, optionsGroupRegex, defaultItemRegex, parseOption);
}

// Returns array of command positionals
function parsePositionals(helpText) {
  return parseGroup(helpText, positionalsGroupRegex, defaultItemRegex, parseOption);
}

// Returns array of command examples
function parseExamples(helpText) {
  const parseExample = (match) => {
    return {
      usage: match[1],
      description: match[2],
    };
  };
  return parseGroup(helpText, exampleGroupRegex, defaultItemRegex, parseExample);
}

// Return command line help for a single command from by invoking "stripes <command> --help"
function getYargsHelpText(command, scriptPath) {
  logger.log(`invoking child process for "${scriptPath} ${command} --help"...`);
  const helpText = childProcess.execSync(`${scriptPath} ${command} --help`, { encoding: 'utf8' });
  logger.log(`completed child process for "${scriptPath} ${command} --help"`);
  return helpText;
}

// Walks the entire command tree as visible from --help
function gatherCommands(commandName, scriptPath) {
  const name = commandName.replace(/^stripes\s?/, '');
  const helpText = getYargsHelpText(name, scriptPath);
  return {
    name,
    fullName: commandName,
    description: parseDescription(helpText),
    usage: parseUsage(helpText),
    subCommands: parseSubCommands(helpText).map(sub => gatherCommands(sub, scriptPath)),
    positionals: parsePositionals(helpText),
    options: parseOptions(helpText),
    examples: parseExamples(helpText),
  };
}

module.exports = {
  gatherCommands,
};
