const importLazy = require('import-lazy')(require);

const { mainHandler } = importLazy('../../cli/main-handler');
const path = importLazy('path');
const fs = importLazy('fs');
const simpleGit = importLazy('simple-git/promise');
const { allModules } = importLazy('../../environment/inventory');
const AliasService = importLazy('../../platform/alias-service');


function pullRepository(dir) {
  const git = simpleGit(dir);

  // Rejects if repo is not is suitable for pulling
  const okToPull = () => new Promise((resolve, reject) => {
    git.status()
      .then((status) => {
        if (!status.isClean()) {
          reject(new Error('Branch contains changes.'));
        }
        if (status.ahead) {
          reject(new Error('Branch contains committed changes to push.'));
        }
        if (status.current !== 'master') {
          reject(new Error(`Branch is not master. (${status.current})`));
        }
        resolve(status);
      });
  });

  return new Promise((resolve) => {
    const relativeDir = path.relative(path.resolve(), dir);
    okToPull(dir)
      .then(() => git.pull())
      .then((pullSummary) => {
        console.log(`Pulled "${relativeDir}"`, pullSummary.summary);
        resolve();
      })
      .catch((err) => {
        console.log(`Error pulling "${relativeDir}"`, err.message || err);
        resolve();
      });
  });
}

function pullCommand(argv, context) {
  if (context.type !== 'workspace' && context.type !== 'platform') {
    console.log('This command must be run from a platform or workspace context');
    return Promise.resolve();
  }

  let reposToPull = [];

  if (context.type === 'workspace') {
    // When in a workspace, see what we have
    const files = fs.readdirSync(context.cwd);
    reposToPull = files.filter(file => allModules.includes(file))
      .map(file => path.resolve(context.cwd, file));
  } else {
    // When in a platform directory, rely on aliases
    const aliasService = new AliasService();
    reposToPull = Object.values(aliasService.getValidatedAliases())
      .map(alias => alias.path);
  }

  return new Promise((resolve) => {
    let pulls;
    reposToPull.forEach((dir) => {
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
  describe: 'Pull latest code for a platform or workspace',
  builder: (yargs) => {
    yargs
      .example('$0 platform pull', 'Pull repositories in the current directory (within workspace)')
      .example('$0 platform pull', 'Pull repositories for all platform aliases (within platform)');
    return yargs;
  },
  handler: mainHandler(pullCommand),
};
