const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../cli/context-middleware');
const fs = importLazy('fs');
const process = importLazy('process');
const _ = importLazy('lodash');
const { ESLint } = require('eslint');

function createESLintInstance(overrideConfig) {
  return new ESLint({ overrideConfig });
}

const lineFormat = (line, column) => `${_.padStart(line, 4)}:${_.padEnd(column, 3)}`;
const messageFormat = (message) => _.padEnd(message, 90);
const severityFormat = (severity) => _.padEnd(severity === 1 ? 'warning' : 'error', 10);
const messagesFormat = (list) => {
  return list.map(m => `${lineFormat(m.line, m.column)}${severityFormat(m.severity)}${messageFormat(m.message)}${m.ruleId}`).join('\n');
};

const resultFormatter = (message) => (
  `${message.filePath}\n${messagesFormat(message.messages)}\n`
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

      for (const m of results.filter(i => i.warningCount > 0 || i.errorCount > 0)) {
        console.log(resultFormatter(m));
      }

      const dingCount = errors + warnings;
      if (errors || warnings) {
        console.warn(`✖ ${dingCount} problem${dingCount === 1 ? '' : 's'} (${errors} errors, ${warnings} warnings)`);
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
