import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire, SourceMap } from 'node:module';
import loggerFactory from '../cli/logger.js';

const require = createRequire(import.meta.url);
const logger = loggerFactory('playwright');

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
export function getTestIndex(cwd, dirs = ['test/bigtest', 'test', 'tests']) {
  let file = path.join(cwd, dirs[0], 'index.js');
  let i = 0;

  while (!fs.existsSync(file) && dirs[++i]) {
    file = path.join(cwd, dirs[i], 'index.js');
  }

  return file;
}

// Converts a source map entry's source name, e.g. "webpack://app/./lib/Button/Button.js?abcd", to a path relative to cwd.
// Returns undefined for webpack internals and externals that are not files.
export function toRelativePath(source, cwd) {
  if (!source) return undefined;
  // the namespace may contain a slash (@folio/stripes-components), so look for the first ./ or ../ segment
  const match = /^webpack:\/\/.*?\/(\.{1,2}\/.*)$/.exec(source);
  if (!match) return undefined;
  return path.relative(cwd, path.resolve(cwd, match[1].split('?')[0])).split(path.sep).join('/');
}

// Builds a function mapping a position in the test bundle to "relative/path.js:line" using the bundle's source map.
// With no source map (or no match) the function returns undefined.
export function sourceLocator(sourceMap, cwd) {
  return (line, column) => {
    if (!sourceMap || !line) return undefined;
    const origin = sourceMap.findOrigin(line, column || 1);
    const file = toRelativePath(origin?.fileName, cwd);
    if (!file) logger.log('unmapped position', line, column, origin?.fileName);
    return file ? `${file}:${origin.lineNumber}` : undefined;
  };
}

// Replaces positions in the test bundle (http://host/tests.js:123:45) in a stack trace with source file locations.
export function mapStack(stack, locate) {
  return String(stack ?? '').replace(/(?:https?:\/\/[^\s)]+?\/)?\btests\.js:(\d+):(\d+)/g,
    (frame, line, column) => locate(Number(line), Number(column)) || frame);
}

// Reads the source map the bundle was built with, if any.
export function readSourceMap(outDir) {
  try {
    return new SourceMap(JSON.parse(fs.readFileSync(path.join(outDir, 'tests.js.map'), 'utf8')));
  } catch (e) {
    logger.log('no usable source map:', e.message);
    return null;
  }
}

// ANSI colors, only when writing to a terminal that wants them (https://no-color.org).
const useColor = () => (process.env.FORCE_COLOR ? process.env.FORCE_COLOR !== '0' : process.stdout.isTTY && !process.env.NO_COLOR);
const color = (code, text) => (useColor() ? `\u001b[${code}m${text}\u001b[0m` : text);
const dim = text => color(2, text);
const RESULT_LABELS = {
  passed: () => color(32, '✓ PASS'),
  failed: () => color(31, '✗ FAIL'),
  pending: () => color(33, '- SKIP'),
};

// Test files live in a tests/ (or __tests__) directory or are named *-test.js, *.test.js or *.spec.js.
const TEST_FILE = /(^|\/)(tests?|__tests__)\/|[-.](test|spec)\.[cm]?[jt]sx?$/i;

// A RegExp whose test() additionally requires the context key to pass `accept`. Webpack only calls test() on a
// context's regExp; `source` is made unique per filter so differently-filtered contexts are not treated as the same module.
class FilteredRegExp extends RegExp {
  constructor(original, accept, id) {
    super(`(?:${original.source})|(?!)${Buffer.from(id).toString('hex')}`, original.flags);
    this.original = original;
    this.accept = accept;
  }

  test(key) {
    this.original.lastIndex = 0;
    return this.original.test(key) && this.accept(key);
  }
}

// Restricts the require.context() calls of the test index to the files matching the given filters, so only those
// files are bundled. A filter is either the path of an existing file or a regular expression (case-insensitive)
// tested against the file's path relative to the module root, e.g. "button" or "Button.*-test". Only test files are
// filtered: other files in a context (e.g. all sources, loaded for coverage and their side effects) are kept, since tests
// may depend on them. Files must still be accepted by the context's own pattern. Contexts inside node_modules are left alone.
export class FileFilterPlugin {
  constructor(filters, cwd) {
    this.cwd = cwd;
    this.filters = filters.map((f) => {
      const abs = path.resolve(cwd, f);
      if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return { abs };
      try {
        return { re: new RegExp(f, 'i') };
      } catch (e) {
        throw new Error(`--file "${f}" is neither an existing file nor a valid regular expression: ${e.message}`);
      }
    });
  }

  matches(resource, key) {
    const abs = path.resolve(resource, key);
    const rel = path.relative(this.cwd, abs).split(path.sep).join('/');
    if (!TEST_FILE.test(rel)) return true;
    return this.filters.some(f => (f.abs ? f.abs === abs : f.re.test(rel)));
  }

  apply(compiler) {
    compiler.hooks.contextModuleFactory.tap('FileFilterPlugin', (factory) => {
      factory.hooks.afterResolve.tap('FileFilterPlugin', (data) => {
        const resource = data?.resource;
        if (typeof resource !== 'string' || !data.regExp) return;
        if (resource.includes(`${path.sep}node_modules${path.sep}`)) return;
        if (path.relative(this.cwd, resource).startsWith('..')) return;

        data.regExp = new FilteredRegExp(data.regExp, key => this.matches(resource, key), this.filters.map(f => f.abs || f.re.source).join('\n'));
      });
    });
  }
}

// Serializes mocha results into a JUnit XML document (one testsuite per browser).
export function buildJunit(results, browserName) {
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
// Tests and suites are tagged with the position in tests.js where they were declared; Node maps it back to the source file.
function declaredAt() {
  const lines = String(new Error().stack).split('\\n');
  for (const line of lines) {
    const m = line.match(/tests[.]js:([0-9]+):([0-9]+)/);
    if (m) { return { line: Number(m[1]), column: Number(m[2]) }; }
  }
  return null;
}
function located(fn) {
  const wrapped = function () {
    const loc = declaredAt();
    const result = fn.apply(this, arguments);
    if (result && typeof result === 'object') { result.__loc = loc; }
    return result;
  };
  Object.assign(wrapped, fn);
  ['skip', 'only'].forEach((k) => { if (typeof fn[k] === 'function') { wrapped[k] = located(fn[k]); } });
  return wrapped;
}
window.mochaExports = {
  describe: located(describe), it: located(it), context: located(context), specify: located(specify),
  before, after, beforeEach, afterEach,
  xdescribe: located(xdescribe), xit: located(xit), xcontext: located(xcontext), xspecify: located(xspecify)
};
</script>
<script src="tests.js"></script>
<script src="run.js"></script>
</body></html>`;

// Mocha is configured by the Node side via window.__mochaOptions (grep etc.), results go out via window.__report.
const RUN_JS = `
const opts = window.__mochaOptions || {};
if (opts.grep) { mocha.grep(opts.grep); }
if (opts.timeout !== undefined) { mocha.timeout(opts.timeout); }
const runner = mocha.run();
const report = window.__report;
['suite', 'suite end', 'pass', 'fail', 'pending'].forEach((evt) => {
  runner.on(evt, (item, err) => {
    report(evt, item && {
      title: item.title,
      fullTitle: item.fullTitle && item.fullTitle(),
      loc: item.__loc || null,
      duration: item.duration,
      err: err ? { message: err.message || String(err), stack: err.stack || err.message || String(err) } : undefined
    });
  });
});
// Mirror failures and the summary to the browser console so they are visible in DevTools (e.g. with --headed).
runner.on('fail', (item, err) => {
  console.error('\\u2717 ' + item.fullTitle() + '\\n' + (err && (err.stack || err.message) || err));
});
runner.on('end', () => {
  const { passes, failures, pending } = runner.stats;
  console.log(passes + ' passed, ' + failures + ' failed, ' + pending + ' skipped');
  report('done', { coverage: window.__coverage__ || null });
});
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

export default class PlaywrightService {
  constructor(cwd) {
    this.cwd = cwd;
  }

  // Adapts the stripes webpack config for a browser test bundle served as static files.
  // When `files` (paths or regular expressions, see FileFilterPlugin) is given, only matching test files are bundled and run.
  generateWebpackConfig(webpackConfig, outDir, files = []) {
    const config = { ...webpackConfig };
    config.entry = { tests: getTestIndex(this.cwd) };
    config.output = { ...config.output, path: outDir, filename: '[name].js', publicPath: '' };
    // tests import describe/it from 'mocha'; map that to globals provided by the runner page
    // rather than bundling a second copy of mocha.
    config.externals = [].concat(config.externals || [], { mocha: 'mochaExports' });
    config.watch = false;
    // line-level source map so failures and tests can be traced back to their source files (see sourceLocator)
    config.devtool = 'cheap-module-source-map';
    if (files.length) {
      config.plugins = [...(config.plugins || []), new FileFilterPlugin(files, this.cwd)];
    }
    return config;
  }

  writeStaticFiles(outDir) {
    const mochaJs = require.resolve('mocha/mocha.js', { paths: [this.cwd, import.meta.dirname] });
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

  // For failures without a declaration position (e.g. a failing hook): the first project source frame in the stack.
  firstSourceFrame(stack, locate) {
    const frames = mapStack(stack, locate).split('\n');
    const frame = frames.find(f => /[\s(][^\s()]+:\d+(?::\d+)?\)?$/.test(f) && !/https?:|node_modules/.test(f));
    return frame && /[\s(]([^\s()]+:\d+)(?::\d+)?\)?$/.exec(frame)?.[1];
  }

  writeJunit(results, browserName) {
    const dir = path.join(this.cwd, 'artifacts/runTest');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `TESTS-${browserName}.xml`), buildJunit(results, browserName));
  }

  // Browser coverage is istanbul data (see istanbul-loader.js); nyc turns it into reports.
  writeCoverage(coverage) {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripes-coverage-'));
    try {
      fs.writeFileSync(path.join(tempDir, 'coverage.json'), JSON.stringify(coverage));
      const nyc = require.resolve('nyc/bin/nyc.js', { paths: [import.meta.dirname] });
      execFileSync(process.execPath, [
        nyc, 'report',
        '--cwd', this.cwd,
        '--temp-dir', tempDir,
        '--report-dir', path.join(this.cwd, 'artifacts/coverage'),
        '--reporter', 'text-summary',
        '--reporter', 'lcov',
      ], { stdio: 'inherit' });
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  async launch(options) {
    const { default: playwright } = await import('playwright');
    const type = playwright[options.browser];
    if (!type) {
      throw new Error(`Unknown browser "${options.browser}". Use chromium, firefox or webkit.`);
    }
    const headed = !!(options.headed || options.show); // showing the tests (and debugging them) needs a visible browser
    const args = options.browser === 'chromium' ? ['--no-sandbox', '--disable-web-security'] : [];
    try {
      return await type.launch({ headless: !headed, devtools: headed && options.browser === 'chromium', args });
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
    const { default: webpack } = await import('webpack');
    const compiler = webpack(this.generateWebpackConfig(webpackConfig, outDir, opts.files || []));

    let state;
    let locate = () => undefined;
    const startRun = () => {
      state = { results: [], suites: [], started: false, coverage: null };
      state.done = new Promise((resolve) => { state.finish = resolve; });
    };
    startRun();

    const server = await this.serve(outDir);
    const browser = await this.launch(opts);
    const onSigint = () => { cleanup().finally(() => process.exit(130)); };
    process.once('SIGINT', onSigint);
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const cleanup = async () => {
      process.off('SIGINT', onSigint);
      await browser.close().catch(() => {});
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
            const where = locate(item.loc?.line, item.loc?.column) || this.firstSourceFrame(item.err?.stack, locate);
            console.log(`  ${RESULT_LABELS[result]()}  ${item.fullTitle}${where ? `  ${dim(where)}` : ''}`);
          }
          if (result === 'failed') console.log(`        ${item.err?.message}`);
          break;
        }
        case 'done':
          state.coverage = item.coverage;
          state.finish();
          break;
        default:
      }
    });
    await page.addInitScript((mochaOptions) => { window.__mochaOptions = mochaOptions; }, { grep: opts.grep, timeout: opts.show ? 0 : undefined });
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
      locate = sourceLocator(readSourceMap(outDir), this.cwd);
      await page.goto(`http://127.0.0.1:${server.address().port}/runner.html`);
      await state.done;
      if (state.failedToLoad) {
        console.error('Test bundle failed to load.');
        return false;
      }
      const { results } = state;
      if (opts.files?.length && !results.length) {
        console.error(`No tests found for --file ${opts.files.join(' ')}`);
        return false;
      }
      const failed = results.filter(r => r.state === 'failed');
      const passed = results.filter(r => r.state === 'passed').length;
      const pending = results.filter(r => r.state === 'pending').length;
      const summary = `[${opts.browser}] ${passed} passed, ${failed.length} failed, ${pending} skipped (${results.length} total)`;
      let summaryColor = 32;
      if (failed.length) summaryColor = 31;
      else if (pending) summaryColor = 33;
      console.log(`\n${color(summaryColor, summary)}`);
      const skipped = results.filter(r => r.state === 'pending');
      if (skipped.length) {
        console.log(color(33, '\nSKIPPED:'));
        skipped.forEach((r) => {
          const where = locate(r.loc?.line, r.loc?.column);
          console.log(`  ${r.fullTitle}${where ? `  ${dim(where)}` : ''}`);
        });
      }
      failed.forEach((r) => { console.log(`\n${color(31, 'FAILED:')} ${r.fullTitle}\n${mapStack(r.err?.stack, locate)}`); });
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
      const passed = await runOnce();
      if (opts.show) {
        console.log('\nShow mode: the browser is left open. Close it or press Ctrl+C to exit.');
        await new Promise((resolve) => { browser.on('disconnected', resolve); });
      }
      return passed;
    } finally {
      await cleanup();
    }
  }
}
