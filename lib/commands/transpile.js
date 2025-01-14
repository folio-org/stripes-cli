const importLazy = require('import-lazy')(require);
const path = require('node:path');
const { spawn } = require('node:child_process');

const { contextMiddleware } = importLazy('../cli/context-middleware');

/**
 * transpile
 * @param {object} argv arguments parsed by yargs
 */
function transpileCommand(argv) {
  // Default transpile command to production env
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'production';
  }

  console.info('Transpiling...');

  const transpile = spawn('babel', [
    argv.files,
    '--ignore', `dist,node_modules,.storybook,karma.conf.js,jest.config.js,test,tests,${argv.files}/**/tests,${argv.files}/**/*.test.js`,
    '-d', 'dist', // output directory
    '-s',         // include sourcemaps
    '-D',         // copy over non-compilable files
    '--delete-dir-on-start',  // clean
    '--config-file', `${__dirname}${path.sep}transpile-babel.config.json`,
  ]);

  transpile.stdout.on('data', (data) => {
    console.log(`${data}`);
  });

  transpile.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  // transpile.on('close', (code) => {
  //   console.log(`child process exited with code ${code}`);
  // });
}

module.exports = {
  command: 'transpile',
  describe: 'Transpile single module',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .example('$0 transpile --files <path>', 'Transpile files in <path>');
    yargs.option('files', {
      describe: 'Path to directory containing files to transpile',
      type: 'string',
      default: './src',
    });

    return yargs;
  },
  handler: transpileCommand,
};
