const importLazy = require('import-lazy')(require);

const inquirer = importLazy('inquirer');

// Convert Yargs CLI options to Inquire.js questions
// This allows options/questions to be defined in a consistent format
function yargsToInquirer(yargsOptions) {
  return Object.keys(yargsOptions).map((key) => {
    const option = yargsOptions[key];
    return Object.assign({}, {
      name: key,
      type: option.type === 'boolean' ? 'confirm' : 'input',
      message: option.describe,
      default: option.default,
      choices: option.choices,
    },
    // Any Inquirer-specific properties that don't have a Yargs equivalent can be specified here
    // See authOptions.password in ./common-options.js as an example
    option.inquirer);
  });
}

// Check for missing Yargs input and ask if necessary
function askIfUndefined(argv, yargsOptions) {
  const askFor = {};
  Object.keys(yargsOptions).forEach((key) => {
    if (!argv[key]) {
      askFor[key] = yargsOptions[key];
    }
  });
  const questions = yargsToInquirer(askFor);
  return inquirer.prompt(questions).then(answers => Object.assign({}, argv, answers));
}

// Wrapper around Yargs command handler to prompt for missing input prior to running command
function promptHandler(yargsOptions, originalHandler) {
  return argv => askIfUndefined(argv, yargsOptions).then(answers => originalHandler(answers));
}

module.exports = {
  yargsToInquirer,
  askIfUndefined,
  promptHandler,
};
