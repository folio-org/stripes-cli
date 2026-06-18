const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

function hasCommand(cmd) {
  try {
    const v = childProcess.execSync(`${cmd} --version`, { encoding: 'utf8' }).trim();
    // simple check that command exists and returns something
    return !!v;
  } catch (e) {
    return false;
  }
}

function detect(projectDir) {
  // Env override
  const env = process.env.STRIPES_PKG_MANAGER;
  if (env) return env;

  // Prefer pnpm if a lockfile exists nearby
  try {
    const pnpmLock = path.join(projectDir || process.cwd(), 'pnpm-lock.yaml');
    if (fs.existsSync(pnpmLock) && hasCommand('pnpm')) return 'pnpm';
  } catch (e) {
    // ignore
  }

  if (hasCommand('pnpm')) return 'pnpm';
  if (hasCommand('yarn')) return 'yarn';
  if (hasCommand('npm')) return 'npm';

  // default to npm if nothing else
  return 'npm';
}

function execCmd(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const full = `${cmd} ${args.join(' ')}`.trim();
    const p = childProcess.exec(full, options, (error) => {
      if (error) return reject(error);
      resolve({ isInstalled: true, appDir: options && options.cwd });
    });
    if (p && p.stdout) p.stdout.on('data', d => console.log(`  ${d.toString().trim()}`));
    if (p && p.stderr) p.stderr.on('data', d => console.error(`  ${d.toString().trim()}`));
  });
}

function install(projectDir) {
  const pm = detect(projectDir);
  console.log(`Using package manager: ${pm}`);
  if (pm === 'pnpm') return execCmd('pnpm', ['install', '--frozen-lockfile'], { cwd: projectDir });
  if (pm === 'yarn') return execCmd('yarn', [], { cwd: projectDir });
  return execCmd('npm', ['install'], { cwd: projectDir });
}

function add(projectDir, packageName, isDev) {
  const pm = detect(projectDir);
  console.log(`Using package manager: ${pm}`);
  const pkgs = [].concat(packageName).join(' ');
  if (pm === 'pnpm') {
    const flag = isDev ? ['-D'] : [];
    return execCmd('pnpm', ['add'].concat(flag).concat([pkgs]), { cwd: projectDir });
  }
  if (pm === 'yarn') {
    const flag = isDev ? '--dev' : '';
    return execCmd('yarn', ['add', flag, pkgs].filter(Boolean), { cwd: projectDir });
  }
  const flag = isDev ? ['--save-dev'] : ['--save'];
  return execCmd('npm', ['install'].concat(flag).concat([pkgs]), { cwd: projectDir });
}

module.exports = {
  detect,
  install,
  add,
};
