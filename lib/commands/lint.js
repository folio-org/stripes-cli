const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const fs = importLazy('fs');
const process = importLazy('process');
const _ = importLazy('lodash');
const chalk = importLazy('chalk');

const { ESLint } = require('eslint');

function createESLintInstance(overrideConfig) {
  return new ESLint({ overrideConfig });
}

const lineFormat = (line, column) => chalk.green(`${_.padStart(line, 4)}:${_.padEnd(column, 3)}`);
const messageFormat = (message, maxLen) => _.padEnd(message, maxLen);
const severityFormat = (severity) => severity === 1 ? chalk.green(_.padEnd('warning', 10)) : chalk.red(_.padEnd('error', 10));
const messagesFormat = (list) => {
  const maxLen = Math.max(...list.map(m => m.message.length)) + 2;
  return list.map(m => `${lineFormat(m.line, m.column)}${severityFormat(m.severity)}${messageFormat(m.message, maxLen)}${m.ruleId}`).join('\n');
};

const resultFormatter = (message) => (
  `${chalk.underline(message.filePath)}\n${messagesFormat(message.messages)}\n`
);

const lintCommand = async () => {
  let rules = null;
  if (fs.existsSync('.eslintrc')) {
    rules = JSON.parse(fs.readFileSync('.eslintrc'));
  }

  const eslint = createESLintInstance(rules);
  const dirs = ['./lib', './src'];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      const results = await eslint.lintFiles(dir);
      const warnings = results.reduce(
        (acc, result) => acc + result.warningCount,
        0,
      );
      const errors = results.reduce(
        (acc, result) => acc + result.errorCount,
        0,
      );

      const fwarnings = results.reduce(
        (acc, result) => acc + result.fixableWarningCount,
        0,
      );
      const ferrors = results.reduce(
        (acc, result) => acc + result.fixableErrorCount,
        0,
      );

      for (const m of results.filter(i => i.warningCount > 0 || i.errorCount > 0)) {
        console.log(resultFormatter(m));
      }

      const dingCount = errors + warnings;
      const theme = errors ? chalk.bold.red : chalk.bold.green;
      if (errors || warnings) {
        console.warn(theme(`✖ ${dingCount} problem${dingCount === 1 ? '' : 's'} (${errors} errors, ${warnings} warnings)`));
      }
      if (ferrors || fwarnings) {
        console.warn(theme(`  ${ferrors} error${ferrors === 1 ? '' : 's'} and ${fwarnings} warning${fwarnings === 1 ? '' : 's'} potentially fixable with the \`--fix\` option.`));
      }

      if (errors) {
        process.exit(1);
      }
    }
  }
};

module.exports = {
  command: 'lint',
  describe: 'lint',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ]);
  },
  handler: lintCommand,
};
