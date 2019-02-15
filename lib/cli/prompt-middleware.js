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
    // Also check for yargs alias
    if (!argv[key] && !argv[yargsOptions[key].alias]) {
      askFor[key] = yargsOptions[key];
    }
  });
  const questions = yargsToInquirer(askFor);
  if (questions.length && argv.interactive) {
    return inquirer.prompt(questions).then(answers => Object.assign({}, argv, answers));
  } else {
    return Promise.resolve(argv);
  }
}

// Returns middleware to prompt for missing input prior to running command
function promptMiddleware(yargsOptions) {
  return (argv) => askIfUndefined(argv, yargsOptions);
}

module.exports = {
  yargsToInquirer,
  askIfUndefined,
  promptMiddleware,
};
