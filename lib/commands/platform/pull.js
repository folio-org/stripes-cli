const importLazy = require('import-lazy')(require);

const { contextMiddleware } = importLazy('../../cli/context-middleware');
const simpleGit = importLazy('simple-git/promise');
const DevelopmentEnvironment = importLazy('../../environment/development');

function isClean(status) {
  const check = ['conflicted', 'created', 'deleted', 'modified', 'renamed'];
  return check.reduce((sum, name) => sum + status[name].length, 0) === 0;
}

function pullRepository(dir) {
  const git = simpleGit(dir);

  // Rejects if repo is not is suitable for pulling
  const okToPull = () => new Promise((resolve, reject) => {
    git.status()
      .then((status) => {
        if (!isClean(status)) {
          reject(new Error('Branch contains changes.'));
        }
        if (status.ahead) {
          reject(new Error('Branch contains committed changes to push.'));
        }
        if (status.current !== 'master') {
          reject(new Error(`Branch is not master. (${status.current})`));
        }
        resolve(status);
      })
      .catch((err) => {
        reject(err);
      });
  });

  return new Promise((resolve) => {
    okToPull(dir)
      .then(() => git.pull())
      .then((pullSummary) => {
        let prefix = '';
        let postfix = '';

        if (process.env.TERM !== 'dumb') {
          if (pullSummary.summary.changes !== 0 || pullSummary.summary.insertions !== 0 || pullSummary.summary.deletions !== 0) {
            prefix = '\x1b[33m';
            postfix = '\x1b[0m';
          }
        }

        console.log(`${prefix}Pulled "${dir}"${postfix}`, pullSummary.summary);
        resolve();
      })
      .catch((err) => {
        let prefix = '*** ';
        let postfix = '';
        if (process.env.TERM !== 'dumb') {
          prefix = '\x1b[31m⚠️  ';
          postfix = '\x1b[0m';
        }
        console.log(`${prefix}Not pulled "${dir}"${postfix}`, err.message || err);
        resolve();
      });
  });
}


function pullCommand(argv) {
  const context = argv.cliContext;
  if (!context.isWorkspace && !context.isPlatform) {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  const dev = new DevelopmentEnvironment(context.cwd, context.isWorkspace);
  dev.loadExistingModules();
  const moduleDirs = dev.getModulePaths();

  // While the workspace directory is needed for cleaning and installing, it is not used for pulling so omit it
  if (context.isWorkspace) {
    const workspaceIndex = moduleDirs.findIndex(dir => dir === context.cwd);
    if (workspaceIndex > -1) {
      moduleDirs.splice(workspaceIndex, 1);
    }
  }

  return new Promise((resolve) => {
    let pulls;
    moduleDirs.forEach((dir) => {
      pulls = pulls ? pulls.then(() => pullRepository(dir)) : pullRepository(dir);
    });

    pulls.then(() => {
      console.log('Done.');
      resolve();
    });
  });
}

module.exports = {
  command: 'pull',
  describe: 'Git pull latest code for a platform or workspace including aliases',
  builder: (yargs) => {
    yargs
      .middleware([
        contextMiddleware(),
      ])
      .example('$0 platform pull', 'Pull all clean repositories including aliases');
    return yargs;
  },
  handler: pullCommand,
};
