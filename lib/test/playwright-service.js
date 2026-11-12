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
  '.gif': 'image/gif',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.map': 'application/json',
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

const ABSOLUTE_PREFIX = '/absolute/';

// On Windows output.path starts with a drive letter rather than a slash, so the translations plugin's
// `./absolute${output.path}` has no separator and the browser requests `/absoluteC:/Users/...`. Insert the missing slash
// so both forms look alike. (The in-browser passthrough shim below does the same.)
const normalizeAbsolute = pathname => pathname.replace(/^\/absolute(?=[a-z]:)/i, ABSOLUTE_PREFIX);

// Maps a request URL onto a file below outDir, or returns null when there is no such mapping (-> 404).
// Besides plain outDir-relative URLs, supports the karma-compatible `/absolute/<outDir>/...` form that stripes-webpack's
// translations plugin emits when NODE_ENV=test (publicPath = `./absolute${output.path}`). On Windows the browser sends
// `/absolute/C:/Users/...`; on posix the leading slash of the path is lost (`/absolute/tmp/...`).
export function resolveRequestFile(outDir, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  pathname = normalizeAbsolute(pathname.replace(/\\/g, '/'));

  let file;
  if (pathname.startsWith(ABSOLUTE_PREFIX)) {
    const rest = path.posix.normalize(pathname.slice(ABSOLUTE_PREFIX.length)).replace(/^\/+/, '');
    const root = outDir.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
    const ci = process.platform === 'win32' || /^[a-z]:/i.test(root);
    const norm = s => (ci ? s.toLowerCase() : s);
    if (norm(rest) !== norm(root) && !norm(rest).startsWith(`${norm(root)}/`)) return null;
    file = path.join(outDir, rest.slice(root.length));
  } else {
    file = path.join(outDir, pathname);
  }

  // traversal guard: the resolved file must be inside outDir
  const rel = path.relative(outDir, file);
  if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) return null;
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
// Support code under such a directory (e.g. test/bigtest/network/config.js, which sets up mirage) is not a test and must always load.
const TEST_FILE = /(^|\/)(tests?|__tests__)\/|[-.](test|spec)\.[cm]?[jt]sx?$/i;
const SUPPORT_DIR = /(^|\/)(network|mirage|helpers?|interactors?|fixtures?|mocks?|__mocks__|setup|support|utils?)\//i;
const isTestFile = rel => TEST_FILE.test(rel) && !(SUPPORT_DIR.test(rel) && !/[-.](test|spec)\.[cm]?[jt]sx?$/i.test(rel));

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
    if (!isTestFile(rel)) return true;
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

// Shown in the browser while there is no test page to show: during the (re)build and when a build fails.
// Node drives it by calling window.setStatus({ state, title, detail, files, log, since }).
const STATUS_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>stripes tests</title>
<style>
:root{color-scheme:light dark;--fg:#1d2733;--bg:#f6f7f9;--muted:#5d6878;--accent:#2f6fed;--track:#d5d9e0;--bad:#c62828}
@media (prefers-color-scheme:dark){:root{--fg:#e6e9ee;--bg:#161b22;--muted:#98a2b3;--accent:#6ea0ff;--track:#c4cad4;--bad:#ff7b72}}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--fg);font:16px/1.5 system-ui,sans-serif}
main{width:min(720px,calc(100vw - 32px))}
h1{font-size:1.4rem;margin:0 0 .25rem}
p{margin:.25rem 0;color:var(--muted)}
ul{color:var(--muted);padding-left:1.2rem}
.spinner{width:28px;height:28px;border:3px solid var(--track);border-top-color:var(--accent);border-radius:50%;animation:spin 1s linear infinite;margin-bottom:1rem}
.error h1{color:var(--bad)}
.error .spinner,.idle .spinner{display:none}
pre{overflow:auto;max-height:50vh;padding:.75rem;background:rgba(127,127,127,.14);border-radius:6px;font-size:.8rem;white-space:pre-wrap}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.spinner{animation:none}}
</style></head>
<body><main id="m" class="building" role="status" aria-live="polite">
<div class="spinner"></div><h1 id="title">Preparing tests...</h1><p id="detail"></p><ul id="files"></ul><pre id="log" hidden></pre>
</main>
<script>
var timer;
window.setStatus = function (s) {
  clearInterval(timer);
  document.getElementById('m').className = s.state;
  document.getElementById('title').textContent = s.title;
  var files = document.getElementById('files');
  files.textContent = '';
  (s.files || []).forEach(function (f) { var li = document.createElement('li'); li.textContent = f; files.appendChild(li); });
  var log = document.getElementById('log');
  log.hidden = !s.log;
  log.textContent = s.log || '';
  var detail = document.getElementById('detail');
  var render = function () {
    var elapsed = s.since ? ' (' + Math.floor((Date.now() - s.since) / 1000) + 's)' : '';
    detail.textContent = (s.detail || '') + elapsed;
  };
  render();
  if (s.since) { timer = setInterval(render, 1000); }
};
</script>
</body></html>`;

const CONTEXT_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body>
<script src="passthrough.js"></script>
<script src="mocha.js"></script>
<script src="viewport.js"></script>
<!--GLOBAL_CSS-->
<script>
// No DOM reporter: results are sent to Node (run.js), and mocha's report markup must not pollute the page under test.
mocha.setup({ ui: 'bdd', timeout: 2000, reporter: function NoopReporter() {} });
// Uncaught errors and unhandled rejections reach Node as bare messages (e.g. "MirageError"); log the full detail in the browser console.
window.addEventListener('unhandledrejection', function (e) {
  const r = e.reason;
  console.error('[unhandledrejection]', (r && (r.stack || r.message)) || String(r), r && r.message);
});
window.addEventListener('error', function (e) {
  console.error('[uncaught]', e.message, e.error && e.error.stack);
});
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
runner.on('start', () => {
  report('start', { total: runner.total || (runner.grepTotal ? runner.grepTotal(runner.suite) : 0) });
});
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
// Mirror each result and the summary to the browser console so they are visible in DevTools (e.g. with --show).
runner.on('pass', (item) => {
  console.log('\\u2713 ' + item.fullTitle());
});
runner.on('pending', (item) => {
  console.warn('- ' + item.fullTitle() + ' (skipped)');
});
runner.on('fail', (item, err) => {
  console.error('\\u2717 ' + item.fullTitle() + '\\n' + (err && (err.stack || err.message) || err));
});
runner.on('end', () => {
  const { passes, failures, pending } = runner.stats;
  console.log(passes + ' passed, ' + failures + ' failed, ' + pending + ' skipped');
  report('done', { coverage: window.__coverage__ || null });
});
`;

// Karma served translations from the file system, outside of mirage. To behave the same without every app defining
// mirage routes, fetch() of these paths is routed to the browser's native fetch, which pretender/mirage cannot intercept.
//
// The native fetch is captured before any test code runs and window.fetch becomes an accessor. Assigned functions are
// stored AS-IS, so identity is preserved for code that saves, replaces and restores window.fetch and compares it by
// identity (e.g. stripes-core's FFetch: `this.nativeFetch = fetch; fetch = this.ffetch; ... fetch === this.ffetch`).
// Returning a fixed wrapper from the getter instead makes FFetch's saved "native" fetch the wrapper, which delegates back
// to FFetch: infinite recursion ("Maximum call stack size exceeded"). Only a fetch *polyfill* (pretender's or
// whatwg-fetch's, marked `polyfill === true`), i.e. the bottom of any wrapper chain, is guarded, and the guard is cached per
// polyfill so its identity is stable too. Nothing in pretender or mirage is modified.
export const PASSTHROUGH_PATHS = ['/absolute/', '/translations/'];

export const PASSTHROUGH_JS = `
(function () {
  const paths = window.__passthroughPaths = ${JSON.stringify(PASSTHROUGH_PATHS)};
  const nativeFetch = window.fetch && window.fetch.bind(window);
  if (!nativeFetch) return;
  const isPassthrough = (input) => {
    try {
      const url = new URL(typeof input === 'string' ? input : (input && input.url) || String(input), window.location.href);
      const pathname = url.pathname.replace(/^[/]absolute(?=[a-z]:)/i, '/absolute/'); // Windows: /absoluteC:/Users/...
      return url.origin === window.location.origin && paths.some(p => pathname.startsWith(p));
    } catch (e) {
      return false;
    }
  };
  const guards = new WeakMap();
  const guarded = new WeakSet();
  const guard = (fn) => {
    if (typeof fn !== 'function' || fn.polyfill !== true || guarded.has(fn)) return fn;
    let wrapped = guards.get(fn);
    if (!wrapped) {
      wrapped = function (input, init) {
        return (isPassthrough(input) ? nativeFetch : fn).call(this, input, init);
      };
      wrapped.polyfill = true;
      guards.set(fn, wrapped);
      guarded.add(wrapped);
    }
    return wrapped;
  };
  let current = window.fetch;
  Object.defineProperty(window, 'fetch', {
    configurable: true,
    get() { return current; },
    set(fn) { current = guard(fn); }
  });
}());
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
    // keep stripes' global styles entry (global.css, variables.css); it is not part of the app code so it would otherwise be lost
    const globalCss = webpackConfig.entry?.css;
    config.entry = { ...(globalCss ? { css: globalCss } : {}), tests: getTestIndex(this.cwd) };
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

  writeStaticFiles(outDir, config) {
    const mochaJs = require.resolve('mocha/mocha.js', { paths: [this.cwd, import.meta.dirname] });
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'runner.html'), RUNNER_HTML);
    fs.writeFileSync(path.join(outDir, 'context.html'), CONTEXT_HTML.replace('<!--GLOBAL_CSS-->', config.entry.css ? '<script src="css.js"></script>' : ''));
    fs.writeFileSync(path.join(outDir, 'status.html'), STATUS_HTML);
    fs.writeFileSync(path.join(outDir, 'run.js'), RUN_JS);
    fs.writeFileSync(path.join(outDir, 'viewport.js'), VIEWPORT_JS);
    fs.writeFileSync(path.join(outDir, 'passthrough.js'), PASSTHROUGH_JS);
    fs.copyFileSync(mochaJs, path.join(outDir, 'mocha.js'));
  }

  serve(outDir) {
    const server = http.createServer((req, res) => {
      const file = resolveRequestFile(outDir, req.url);
      if (!file || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
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
    const launchOptions = { headless: !headed, devtools: headed && options.browser === 'chromium', args };
    const notInstalled = e => /Executable doesn't exist|distribution '.*' is not found/i.test(e.message);

    // Playwright's own chromium build is preferred when present. Otherwise fall back to a browser already installed on
    // the machine (Chrome, then Edge) so nothing has to be downloaded.
    if (options.browser === 'chromium') {
      let bundled = false;
      try {
        bundled = fs.existsSync(type.executablePath());
      } catch (e) {
        logger.log('could not locate bundled chromium:', e.message);
      }
      if (!bundled) {
        for (const channel of ['chrome', 'msedge']) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const browser = await type.launch({ ...launchOptions, channel });
            logger.log(`using installed browser: ${channel}`);
            return browser;
          } catch (e) {
            if (!notInstalled(e)) throw e;
            logger.log(`${channel} not found`);
          }
        }
        throw new Error('No chromium browser found. Install Google Chrome or Microsoft Edge, or run: npx playwright install chromium');
      }
    }

    try {
      return await type.launch(launchOptions);
    } catch (e) {
      if (notInstalled(e)) {
        throw new Error(`The ${options.browser} browser is not installed. Run: npx playwright install ${options.browser}`);
      }
      throw e;
    }
  }

  // Runs the test bundle in the browser. Resolves true when all tests pass, or, in watch mode, never.
  async runTests(webpackConfig, options = {}) {
    const opts = { browser: 'chromium', ...options };
    const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stripes-playwright-'));
    const { default: webpack } = await import('webpack');
    const config = this.generateWebpackConfig(webpackConfig, outDir, opts.files || []);
    this.writeStaticFiles(outDir, config);
    const compiler = webpack(config);

    let state;
    let locate = () => undefined;
    const startRun = () => {
      state = { results: [], suites: [], started: false, coverage: null };
      state.done = new Promise((resolve) => { state.finish = () => { state.finished = true; resolve(); }; });
    };
    startRun();
    // Abandons the run in progress, e.g. because the page is about to navigate away or the bundle is about to change.
    // Without this the run would wait forever for a "done" report that can no longer arrive.
    const interruptRun = () => {
      if (!state.finished) {
        state.interrupted = true;
        state.finish();
      }
    };

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

    // A progress bar is kept on the last line of an interactive terminal; result lines are printed above it.
    const interactive = !!process.stdout.isTTY;
    let barShown = false;
    const clearBar = () => {
      if (barShown) process.stdout.write('\r\u001b[2K');
      barShown = false;
    };
    const drawBar = () => {
      if (!interactive || !state.total) return;
      const done = state.results.length;
      const failedCount = state.results.filter(r => r.state === 'failed').length;
      const skippedCount = state.results.filter(r => r.state === 'pending').length;
      const width = 24;
      const filled = Math.min(width, Math.round((done / state.total) * width));
      const bar = `${'█'.repeat(filled)}${'░'.repeat(width - filled)}`;
      const pct = Math.floor((done / state.total) * 100);
      let counts = `${color(32, `✓ ${done - failedCount - skippedCount}`)}`;
      if (failedCount) counts += ` ${color(31, `✗ ${failedCount}`)}`;
      if (skippedCount) counts += ` ${color(33, `- ${skippedCount}`)}`;
      process.stdout.write(`\r\u001b[2K${color(failedCount ? 31 : 36, bar)} ${done}/${state.total} ${pct}%  ${counts}`);
      barShown = true;
    };
    // prints above the progress bar
    const log = (text) => {
      clearBar();
      console.log(text);
      drawBar();
    };

    await page.exposeFunction('__report', (evt, item) => {
      switch (evt) {
        case 'start':
          state.total = item.total;
          drawBar();
          break;
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
          const where = locate(item.loc?.line, item.loc?.column) || this.firstSourceFrame(item.err?.stack, locate);
          let line = `  ${RESULT_LABELS[result]()}  ${item.fullTitle}${where ? `  ${dim(where)}` : ''}`;
          if (result === 'failed') line += `\n        ${item.err?.message}`;
          log(line);
          break;
        }
        case 'done':
          clearBar();
          state.coverage = item.coverage;
          state.finish();
          break;
        default:
      }
    });
    await page.addInitScript((mochaOptions) => { window.__mochaOptions = mochaOptions; }, { grep: opts.grep, timeout: opts.show ? 0 : undefined });
    page.on('console', (m) => { logger.log('[browser]', m.text()); });
    // Diagnostics for missing resources (e.g. translations, SVGs); a de-duplicated summary is printed in verbose mode.
    const failedRequests = new Set();
    const noteFailure = (kind, url) => {
      logger.log(`[${kind}]`, url);
      failedRequests.add(`${kind} ${url}`);
    };
    page.on('response', (r) => { if (r.status() >= 400) noteFailure(String(r.status()), r.url()); });
    page.on('requestfailed', (r) => { noteFailure('failed', r.url()); });
    page.on('pageerror', (e) => {
      console.error('[pageerror]', e.message);
      // the message alone can be uninformative (e.g. "MirageError"); the stack says which request/call caused it
      if (e.stack && e.stack !== e.message) logger.log('[pageerror stack]', e.stack);
      // an error before any suite starts means the bundle never ran; don't wait for it
      if (!state.started) {
        state.failedToLoad = true;
        state.finish();
      }
    });

    // The browser shows a status page while the test bundle is (re)built; only done for a visible browser.
    const visible = !!(opts.headed || opts.show);
    const baseUrl = () => `http://127.0.0.1:${server.address().port}`;
    // updates are queued so they cannot overlap each other or the navigation to the test page
    let statusQueue = Promise.resolve();
    let statusShown = false;
    const showStatus = (status) => {
      if (!visible) return statusQueue;
      statusShown = true;
      statusQueue = statusQueue.then(async () => {
        try {
          if (!page.url().endsWith('/status.html')) await page.goto(`${baseUrl()}/status.html`);
          await page.evaluate(s => window.setStatus(s), status);
        } catch (e) {
          logger.log('could not update status page:', e.message);
        }
      });
      return statusQueue;
    };
    const clock = () => new Date().toLocaleTimeString();
    const seconds = ms => (ms / 1000).toFixed(1);
    const buildErrors = stats => stats.toString({ all: false, errors: true, colors: false }).trim().slice(0, 8000);

    // Report the start and end of each webpack build, in the terminal and in the browser.
    let builds = 0;
    compiler.hooks.watchRun.tap('stripes-playwright', (c) => {
      builds += 1;
      // dependencies in node_modules are not worth listing
      const isFile = (f) => { try { return fs.statSync(f).isFile(); } catch (e) { return true; } }; // directories change whenever a file in them does
      const changed = [...(c.modifiedFiles || [])].filter(isFile).map(f => path.relative(this.cwd, f).split(path.sep).join('/')).filter(f => !f.includes('node_modules'));
      if (builds === 1) {
        console.log('Building test bundle...');
        showStatus({ state: 'building', title: 'Building tests...', detail: 'Bundling the test files', since: Date.now() });
      } else if (!changed.length) {
        // webpack sometimes starts a rebuild without any project file having changed; don't disturb a run for that
        logger.log('rebuild without changed project files; modified:', [...(c.modifiedFiles || [])]);
      } else {
        interruptRun(); // the page is about to navigate to the status page
        const shown = changed.slice(0, 5);
        if (changed.length > shown.length) shown.push(`...and ${changed.length - shown.length} more`);
        console.log(`\n[${clock()}] Change detected${shown.length ? `: ${shown.join(', ')}` : ''}. Rebuilding...`);
        showStatus({ state: 'building', title: 'Rebuilding tests...', detail: 'Changes detected', files: shown, since: Date.now() });
      }
    });
    compiler.hooks.done.tap('stripes-playwright', (stats) => {
      if (!stats.hasErrors()) console.log(`Built test bundle in ${seconds(stats.endTime - stats.startTime)}s.`);
    });

    const runOnce = async () => {
      startRun();
      locate = sourceLocator(readSourceMap(outDir), this.cwd);
      await statusQueue;
      statusShown = false;
      try {
        await page.goto(`${baseUrl()}/runner.html`);
      } catch (e) {
        if (state.interrupted) return null;
        throw e;
      }
      await state.done;
      clearBar();
      if (state.interrupted) {
        console.log(`[${clock()}] Run interrupted by a change.`);
        return null;
      }
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
      const skipped = results.filter(r => r.state === 'pending');
      if (skipped.length) {
        console.log(color(33, '\nSKIPPED:'));
        skipped.forEach((r) => {
          const where = locate(r.loc?.line, r.loc?.column);
          console.log(`  ${r.fullTitle}${where ? `  ${dim(where)}` : ''}`);
        });
      }
      if (failed.length) {
        console.log(color(31, `\nFAILURES (${failed.length}):`));
        failed.forEach((r, i) => { console.log(`\n${color(31, `${i + 1})`)} ${r.fullTitle}\n${mapStack(r.err?.stack, locate)}`); });
      }
      if (opts.verbose && failedRequests.size) {
        console.log(`\nFailed requests (${failedRequests.size}):\n${[...failedRequests].sort().map(l => `  ${l}`).join('\n')}`);
      }
      console.log(`\n${color(summaryColor, summary)}`);
      if (opts.junit) this.writeJunit(results, opts.browser);
      if (opts.coverage && state.coverage) this.writeCoverage(state.coverage);
      return failed.length === 0;
    };

    if (opts.watch) {
      return new Promise((resolve, reject) => {
        let running = false;
        let rerun = false;
        let runs = 0;
        let lastHash;
        let lastPassed = true;

        // closing the browser ends the session
        browser.on('disconnected', () => {
          interruptRun();
          cleanup().then(() => resolve(lastPassed), reject);
        });

        compiler.watch({}, async (err, stats) => {
          if (err || stats.hasErrors()) {
            interruptRun();
            console.error(err || stats.toString({ all: false, errors: true, colors: true }));
            console.log(`\n[${clock()}] Build failed. Waiting for changes...`);
            await showStatus({ state: 'error', title: 'Build failed', detail: 'Waiting for changes...', log: err ? String(err.stack || err) : buildErrors(stats) });
            return;
          }
          // an identical bundle needs no new run, unless the page is still showing a status message
          if (stats.hash === lastHash && !statusShown) {
            logger.log('bundle unchanged; not re-running');
            return;
          }
          lastHash = stats.hash;
          if (running) {
            // changed while a run was going: abandon it and start again with the new bundle
            rerun = true;
            interruptRun();
            return;
          }
          running = true;
          try {
            do {
              rerun = false;
              const passed = await runOnce(); // eslint-disable-line no-await-in-loop
              if (passed !== null) {
                runs += 1;
                lastPassed = passed;
                console.log(`\n[${clock()}] Run ${runs} ${passed ? 'passed' : 'failed'}. Watching for changes...`);
              }
            } while (rerun);
          } catch (e) {
            await cleanup();
            reject(e);
          }
          running = false;
        });
      });
    }

    try {
      console.log('Building test bundle...');
      await showStatus({ state: 'building', title: 'Building tests...', detail: 'Bundling the test files', since: Date.now() });
      await new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
          if (err) {
            reject(err);
          } else if (stats.hasErrors()) {
            console.error(stats.toString({ all: false, errors: true, colors: true }));
            reject(Object.assign(new Error('Webpack build of the test bundle failed.'), { buildErrors: buildErrors(stats) }));
          } else {
            resolve();
          }
        });
      }).catch(async (e) => {
        // with --show, leave the error on screen
        if (opts.show) {
          await showStatus({ state: 'error', title: 'Build failed', detail: 'Close the browser to exit.', log: e.buildErrors || e.message });
          console.error(e.message);
          console.log('\nShow mode: the browser is left open. Close it or press Ctrl+C to exit.');
          await new Promise((resolve) => { browser.on('disconnected', resolve); });
        }
        throw e;
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
