const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const importLazy = require('import-lazy')(require);
const logger = require('../cli/logger')('playwright');

const webpack = importLazy('webpack');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const XML_ESCAPES = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' };
const escapeXml = s => String(s ?? '').replace(/[<>&"']/g, c => XML_ESCAPES[c]);

// The test index is the webpack entry for the bundle: the first index.js found in these directories.
// TODO: Standardize on test folder, `test/bigtest` vs 'test' vs 'tests'
function getTestIndex(cwd, dirs = ['test/bigtest', 'test', 'tests']) {
  let file = path.join(cwd, dirs[0], 'index.js');
  let i = 0;

  while (!fs.existsSync(file) && dirs[++i]) {
    file = path.join(cwd, dirs[i], 'index.js');
  }

  return file;
}

// Serializes mocha results into a JUnit XML document (one testsuite per browser).
function buildJunit(results, browserName) {
  const failures = results.filter(r => r.state === 'failed').length;
  const skipped = results.filter(r => r.state === 'pending').length;
  const time = results.reduce((t, r) => t + (r.duration || 0), 0) / 1000;
  const cases = results.map((r) => {
    let body = '';
    if (r.state === 'failed') {
      body = `<failure message="${escapeXml(r.err?.message)}">${escapeXml(r.err?.stack)}</failure>`;
    } else if (r.state === 'pending') {
      body = '<skipped/>';
    }
    const classname = escapeXml(`${browserName}.${r.suite}`);
    return `<testcase name="${escapeXml(r.title)}" classname="${classname}" time="${(r.duration || 0) / 1000}">${body}</testcase>`;
  }).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="${escapeXml(browserName)}" tests="${results.length}" failures="${failures}" skipped="${skipped}" time="${time}">
    ${cases}
  </testsuite>
</testsuites>
`;
}

// Outer page holds an iframe so `viewport.set/reset` (formerly karma-viewport) can resize the page under test.
// Named runner.html because webpack's HtmlWebpackPlugin emits its own index.html.
const RUNNER_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>stripes tests</title>
<style>html,body{margin:0;height:100%}#tests{border:0;width:100%;height:100%;display:block}</style>
</head><body><iframe id="tests" src="context.html"></iframe></body></html>`;

const CONTEXT_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<script src="mocha.js"></script>
<script src="viewport.js"></script>
<script>
// No DOM reporter: results are sent to Node (run.js), and mocha's report markup must not pollute the page under test.
mocha.setup({ ui: 'bdd', timeout: 2000, reporter: function NoopReporter() {} });
// Tests import { describe, it } from 'mocha'; webpack maps 'mocha' to this global (see externals).
window.mochaExports = {
  describe, it, context, specify, before, after, beforeEach, afterEach,
  xdescribe, xit, xcontext, xspecify
};
</script>
<script src="tests.js"></script>
<script src="run.js"></script>
</body></html>`;

// Mocha is configured by the Node side via window.__mochaOptions (grep etc.), results go out via window.__report.
const RUN_JS = `
const opts = window.__mochaOptions || {};
if (opts.grep) { mocha.grep(opts.grep); }
const runner = mocha.run();
const report = window.__report;
['suite', 'suite end', 'pass', 'fail', 'pending'].forEach((evt) => {
  runner.on(evt, (item, err) => {
    report(evt, item && {
      title: item.title,
      fullTitle: item.fullTitle && item.fullTitle(),
      file: item.file,
      duration: item.duration,
      err: err ? { message: err.message || String(err), stack: err.stack || err.message || String(err) } : undefined
    });
  });
});
runner.on('end', () => report('done', { coverage: window.__coverage__ || null }));
`;

const VIEWPORT_JS = `
window.viewport = {
  set(width, height) {
    const el = window.frameElement;
    el.style.width = width + 'px';
    if (height) { el.style.height = height + 'px'; }
    el.contentDocument.body.getBoundingClientRect();
  },
  reset() {
    const el = window.frameElement;
    el.style.width = '';
    el.style.height = '';
    el.contentDocument.body.getBoundingClientRect();
  }
};
`;

module.exports = class PlaywrightService {
  constructor(cwd) {
    this.cwd = cwd;
  }

  // Adapts the stripes webpack config for a browser test bundle served as static files.
  generateWebpackConfig(webpackConfig, outDir) {
    const config = { ...webpackConfig };
    config.entry = { tests: getTestIndex(this.cwd) };
    config.output = { ...config.output, path: outDir, filename: '[name].js', publicPath: '' };
    // tests import describe/it from 'mocha'; map that to globals provided by the runner page
    // rather than bundling a second copy of mocha.
    config.externals = [].concat(config.externals || [], { mocha: 'mochaExports' });
    config.watch = false;
    return config;
  }

  writeStaticFiles(outDir) {
    const mochaJs = require.resolve('mocha/mocha.js', { paths: [this.cwd, __dirname] });
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'runner.html'), RUNNER_HTML);
    fs.writeFileSync(path.join(outDir, 'context.html'), CONTEXT_HTML);
    fs.writeFileSync(path.join(outDir, 'run.js'), RUN_JS);
    fs.writeFileSync(path.join(outDir, 'viewport.js'), VIEWPORT_JS);
    fs.copyFileSync(mochaJs, path.join(outDir, 'mocha.js'));
  }

  serve(outDir) {
    const server = http.createServer((req, res) => {
      const file = path.join(outDir, decodeURIComponent(req.url.split('?')[0]));
      if (!file.startsWith(outDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
  }

  writeJunit(results, browserName) {
    const dir = path.join(this.cwd, 'artifacts/runTest');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `TESTS-${browserName}.xml`), buildJunit(results, browserName));
  }

  writeCoverage(coverage) {
    const libCoverage = require('istanbul-lib-coverage'); // eslint-disable-line global-require
    const libReport = require('istanbul-lib-report'); // eslint-disable-line global-require
    const reports = require('istanbul-reports'); // eslint-disable-line global-require
    const map = libCoverage.createCoverageMap(coverage);
    const context = libReport.createContext({ dir: path.join(this.cwd, 'artifacts/coverage'), coverageMap: map });
    ['text-summary', 'lcov'].forEach(r => reports.create(r).execute(context));
  }

  async launch(options) {
    const playwright = require('playwright'); // eslint-disable-line global-require
    const type = playwright[options.browser];
    if (!type) {
      throw new Error(`Unknown browser "${options.browser}". Use chromium, firefox or webkit.`);
    }
    const args = options.browser === 'chromium' ? ['--no-sandbox', '--disable-web-security'] : [];
    try {
      return await type.launch({ headless: !options.headed, args });
    } catch (e) {
      if (/Executable doesn't exist/.test(e.message)) {
        throw new Error(`The ${options.browser} browser is not installed. Run: npx playwright install ${options.browser}`);
      }
      throw e;
    }
  }

  // Runs the test bundle in the browser. Resolves true when all tests pass, or, in watch mode, never.
  async runTests(webpackConfig, options = {}) {
    const opts = { browser: 'chromium', ...options };
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripes-playwright-'));
    this.writeStaticFiles(outDir);
    const compiler = webpack(this.generateWebpackConfig(webpackConfig, outDir));

    let state;
    const startRun = () => {
      state = { results: [], suites: [], started: false, coverage: null };
      state.done = new Promise((resolve) => { state.finish = resolve; });
    };
    startRun();

    const server = await this.serve(outDir);
    const browser = await this.launch(opts);
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const cleanup = async () => {
      await browser.close();
      server.close();
      fs.rmSync(outDir, { recursive: true, force: true });
    };

    await page.exposeFunction('__report', (evt, item) => {
      switch (evt) {
        case 'suite':
          state.started = true;
          if (item.title) state.suites.push(item.title);
          break;
        case 'suite end':
          if (item.title) state.suites.pop();
          break;
        case 'pass':
        case 'fail':
        case 'pending': {
          let result = 'pending';
          if (evt === 'fail') result = 'failed';
          if (evt === 'pass') result = 'passed';
          state.results.push({ ...item, state: result, suite: state.suites.join(' ') });
          if (result !== 'passed' || opts.verbose) {
            const mark = { passed: '✓', failed: '✗', pending: '-' }[result];
            console.log(`  ${mark} ${item.fullTitle}`);
          }
          if (result === 'failed') console.log(`      ${item.err?.message}`);
          break;
        }
        case 'done':
          state.coverage = item.coverage;
          state.finish();
          break;
        default:
      }
    });
    await page.addInitScript((mochaOptions) => { window.__mochaOptions = mochaOptions; }, { grep: opts.grep });
    page.on('console', (m) => { logger.log('[browser]', m.text()); });
    page.on('pageerror', (e) => {
      console.error('[pageerror]', e.message);
      // an error before any suite starts means the bundle never ran; don't wait for it
      if (!state.started) {
        state.failedToLoad = true;
        state.finish();
      }
    });

    const runOnce = async () => {
      startRun();
      await page.goto(`http://127.0.0.1:${server.address().port}/runner.html`);
      await state.done;
      if (state.failedToLoad) {
        console.error('Test bundle failed to load.');
        return false;
      }
      const { results } = state;
      const failed = results.filter(r => r.state === 'failed');
      const passed = results.filter(r => r.state === 'passed').length;
      const pending = results.filter(r => r.state === 'pending').length;
      console.log(`\n[${opts.browser}] ${passed} passed, ${failed.length} failed, ${pending} skipped (${results.length} total)`);
      failed.forEach((r) => { console.log(`\nFAILED: ${r.fullTitle}\n${r.err?.stack}`); });
      if (opts.junit) this.writeJunit(results, opts.browser);
      if (opts.coverage && state.coverage) this.writeCoverage(state.coverage);
      return failed.length === 0;
    };

    if (opts.watch) {
      return new Promise((resolve, reject) => {
        let running = false;
        compiler.watch({}, async (err, stats) => {
          if (err || stats.hasErrors()) {
            console.error(err || stats.toString({ all: false, errors: true, colors: true }));
            return;
          }
          if (running) return;
          running = true;
          try {
            await runOnce();
            console.log('\nWatching for changes...');
          } catch (e) {
            await cleanup();
            reject(e);
          }
          running = false;
        });
      });
    }

    try {
      await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          if (err) {
            reject(err);
          } else if (stats.hasErrors()) {
            console.error(stats.toString({ all: false, errors: true, colors: true }));
            reject(new Error('Webpack build of the test bundle failed.'));
          } else {
            resolve();
          }
        });
      });
      return await runOnce();
    } finally {
      await cleanup();
    }
  }
};

module.exports.getTestIndex = getTestIndex;
module.exports.buildJunit = buildJunit;
