/**
 * compile
 * compile all translations in `${repo}/translations` to AST format
 * in `${repo}/translations/compiled`.
 * Exits if the output directory cannot be created
 *
 */
const importLazy = require('import-lazy')(require);

const fs = importLazy('fs');
const path = importLazy('path');
const process = importLazy('process');
const { compile } = importLazy('@formatjs/cli-lib');

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const { globSync } = fs;

/**
 * createOutDir
 * create outDir if it doesn't exist. Exit on failure.
 * @param {*} outDir
 * @returns void
 */
const createOutDir = (outDir) => {
  if (!fs.existsSync(outDir)) {
    try {
      fs.mkdirSync(outDir);
    } catch (err) {
      console.error(`Could not create the output directory ${outDir}`);
      console.info(err);
      process.exit(1);
    }
  }
};

function formatjsCompileCommand(argv) {
  const context = argv.context;
  const basename = path.basename(context.cwd);
  const txPath = path.join(context.cwd, 'translations', basename);
  const outDir = `${txPath}${path.sep}compiled`;
  const opts = {
    ast: true,
    format: 'simple',
  };
  const globSelect = path.join(txPath, '*.json');
  const files = globSync(globSelect);
  if (fs.existsSync(txPath) && files.length > 0) {
    createOutDir(outDir);
    Promise.all(files.map(f => compile([f], opts)))
      .then((results) => {
        const outFiles = files.map(f => path.join(outDir, path.basename(f)));
        return Promise.all(
          results.map((outFile, i) => {
            return fs.writeFileSync(outFiles[i], results[i]);
          })
        );
      });
  } else {
    console.log('Could not find files to translate.');
    process.exit(1);
  }
}

module.exports = {
  command: 'compile',
  describe: 'compile translations to AST for consumption by formatjs',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ]);
    yargs.example('$0 translate compile', 'Compile a module\'s translations.');
    return yargs;
  },
  handler: formatjsCompileCommand,
};
