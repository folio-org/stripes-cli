const Configstore = require('configstore');
const semver = require('semver');
const isInstalledGlobally = require('is-installed-globally');

const CHECK_INTERVAL = 1000 * 60 * 60 * 24 * 7; // one week
const FETCH_TIMEOUT = 1500;
const storageKey = 'update-notifier-stripes-cli';

// Lightweight, dependency-free replacement for `update-notifier`, which pulls in
// several unmaintained transitive packages with known security advisories.
// The latest published version is cached and only re-checked once per week;
// the check itself is entirely best-effort and never blocks or fails the CLI.
module.exports = class UpdateChecker {
  constructor(packageJson) {
    this.packageJson = packageJson;
    this.config = new Configstore(storageKey, {});
    // Exposed as an instance property (rather than read inline) so tests can
    // stub the global-install case without mocking the module itself.
    this.isInstalledGlobally = isInstalledGlobally;
  }

  notifyIfAvailable() {
    const cachedLatest = this.config.get('latestVersion');
    if (cachedLatest && semver.valid(cachedLatest) && semver.gt(cachedLatest, this.packageJson.version)) {
      console.log(`Update available ${this.packageJson.version} -> ${cachedLatest}\nRefer to README.md:\nhttps://github.com/folio-org/stripes-cli`); // NOSONAR
    }
  }

  refreshIfStale() {
    const lastChecked = this.config.get('lastChecked') || 0;
    if (Date.now() - lastChecked < CHECK_INTERVAL) {
      return Promise.resolve();
    }
    this.config.set('lastChecked', Date.now());

    const registry = (this.packageJson.publishConfig && this.packageJson.publishConfig.registry) || 'https://registry.npmjs.org/';
    const url = `${registry.replace(/\/+$/, '')}/${encodeURIComponent(this.packageJson.name)}`;

    return fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const latest = data && data['dist-tags'] && data['dist-tags'].latest;
        if (latest && semver.valid(latest)) {
          this.config.set('latestVersion', latest);
        }
      })
      .catch(() => {
        // Network/registry errors are non-fatal; the check is best-effort only
      });
  }

  // Prints a notice based on the last cached check, then kicks off a fresh
  // (non-blocking) check if the cache is more than a week old.
  check() {
    // Local/dev installs are managed through package.json and the normal
    // install flow, so only nag global installs about updates.
    if (!this.isInstalledGlobally) {
      return Promise.resolve();
    }

    // Skip in CI and other non-interactive contexts to avoid log noise and
    // needless network calls
    if (process.env.CI || !process.stdout.isTTY) {
      return Promise.resolve();
    }

    this.notifyIfAvailable();
    return this.refreshIfStale();
  }
};
