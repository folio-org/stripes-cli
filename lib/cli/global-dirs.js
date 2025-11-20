import globalDirs from 'global-dirs';
import semver from 'semver';
import childProcess from 'child_process';
import path from 'path';
import getLogger from './logger.js';

const logger = getLogger('global-dirs');

function isYarnVersion(version) {
  try {
    const yarnVersion = childProcess.execSync('yarn --version', { encoding: 'utf8' }).trim();
    logger.log('Yarn version', yarnVersion);
    return semver.satisfies(yarnVersion, version);
  } catch (err) {
    logger.error('Unable to determine Yarn version.', err);
    return false;
  }
}

// Starting with Yarn 1.5.1 the global node_modules path changed on Windows. See STCLI-39.
// Check the Yarn version and attempt to correct Yarn paths provided by global-dirs.
if (process.platform === 'win32' && isYarnVersion('>=1.5.1')) {
  logger.log('Original globalDirs.yarn:', globalDirs.yarn);
  globalDirs.yarn.packages = path.join(globalDirs.yarn.prefix, 'Data', 'global', 'node_modules');
  globalDirs.yarn.binaries = path.join(globalDirs.yarn.packages, '.bin');
  logger.log('Updated globalDirs.yarn:', globalDirs.yarn);
}

export default globalDirs;
