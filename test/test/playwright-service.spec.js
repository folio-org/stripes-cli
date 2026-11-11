import chaiMod from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import PlaywrightService, { PASSTHROUGH_JS, getTestIndex, resolveRequestFile, buildJunit, FileFilterPlugin, toRelativePath, sourceLocator, mapStack } from '../../lib/test/playwright-service.js';

const { expect } = chaiMod;

describe('The playwright-service', function () {
  beforeEach(function () {
    this.tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-service-spec-'));
  });

  afterEach(function () {
    fs.rmSync(this.tmp, { recursive: true, force: true });
  });

  describe('getTestIndex function', function () {
    it('finds the first index.js in the search order', function () {
      fs.mkdirSync(path.join(this.tmp, 'test'));
      fs.mkdirSync(path.join(this.tmp, 'tests'));
      fs.writeFileSync(path.join(this.tmp, 'test/index.js'), '');
      fs.writeFileSync(path.join(this.tmp, 'tests/index.js'), '');
      expect(getTestIndex(this.tmp)).to.equal(path.join(this.tmp, 'test/index.js'));
    });

    it('prefers test/bigtest over test', function () {
      fs.mkdirSync(path.join(this.tmp, 'test/bigtest'), { recursive: true });
      fs.writeFileSync(path.join(this.tmp, 'test/index.js'), '');
      fs.writeFileSync(path.join(this.tmp, 'test/bigtest/index.js'), '');
      expect(getTestIndex(this.tmp)).to.equal(path.join(this.tmp, 'test/bigtest/index.js'));
    });

    it('falls back to tests/index.js', function () {
      fs.mkdirSync(path.join(this.tmp, 'tests'));
      fs.writeFileSync(path.join(this.tmp, 'tests/index.js'), '');
      expect(getTestIndex(this.tmp)).to.equal(path.join(this.tmp, 'tests/index.js'));
    });
  });

  describe('resolveRequestFile function', function () {
    const posixOut = '/tmp/stripes-playwright-abc';
    const winOut = 'C:\\Users\\me\\AppData\\Local\\Temp\\stripes-playwright-abc';

    it('maps plain URLs onto outDir and ignores the query string', function () {
      expect(resolveRequestFile(posixOut, '/tests.js?x=1')).to.equal(path.join(posixOut, 'tests.js'));
    });

    it('maps /absolute/ URLs (posix, leading slash dropped)', function () {
      const url = '/absolute/tmp/stripes-playwright-abc/translations/en-1.json';
      expect(resolveRequestFile(posixOut, url)).to.equal(path.join(posixOut, 'translations/en-1.json'));
    });

    it('maps /absolute/ URLs (Windows drive letter)', function () {
      const url = '/absolute/C:/Users/me/AppData/Local/Temp/stripes-playwright-abc/translations/en-1.json';
      expect(resolveRequestFile(winOut, url)).to.equal(path.join(winOut, 'translations/en-1.json'));
    });

    it('rejects /absolute/ URLs outside outDir', function () {
      expect(resolveRequestFile(posixOut, '/absolute/etc/passwd')).to.equal(null);
      expect(resolveRequestFile(posixOut, '/absolute/tmp/stripes-playwright-abcd/x.json')).to.equal(null);
    });

    it('rejects traversal attempts', function () {
      expect(resolveRequestFile(posixOut, '/absolute/../..')).to.equal(null);
      expect(resolveRequestFile(posixOut, '/absolute/tmp/stripes-playwright-abc/../../etc/passwd')).to.equal(null);
      expect(resolveRequestFile(posixOut, '/../etc/passwd')).to.equal(null);
      expect(resolveRequestFile(posixOut, '/%2e%2e/%2e%2e/etc/passwd')).to.equal(null);
    });
  });

  describe('passthrough shim', function () {
    // runs the shim in a sandbox standing in for the browser's window
    const setup = () => {
      const calls = [];
      const nativeFetch = (url) => { calls.push(['native', String(url)]); return Promise.resolve('native'); };
      const window = {
        fetch: nativeFetch,
        location: { href: 'http://127.0.0.1:1234/context.html', origin: 'http://127.0.0.1:1234' },
        URL,
      };
      window.window = window;
      vm.runInNewContext(PASSTHROUGH_JS, window);
      // stands in for pretender's fetch polyfill
      const polyfill = (url) => { calls.push(['mirage', String(url)]); return Promise.resolve('mirage'); };
      polyfill.polyfill = true;
      return { window, calls, nativeFetch, polyfill };
    };

    it('routes translation requests to the native fetch even when a polyfill is installed', async function () {
      const { window, calls, polyfill } = setup();
      window.fetch = polyfill;
      await window.fetch('http://127.0.0.1:1234/absolute/C:/tmp/translations/en-1.json');
      await window.fetch('/translations/en.json');
      await window.fetch('http://127.0.0.1:1234/okapi/users');
      expect(calls.map(c => c[0])).to.deep.equal(['native', 'native', 'mirage']);
    });

    it('also passes through the separator-less Windows form of the translations URL', async function () {
      const { window, calls, polyfill } = setup();
      window.fetch = polyfill;
      await window.fetch('http://127.0.0.1:1234/absoluteC:/Users/me/Temp/stripes-playwright-abc/translations/en-1.json');
      expect(calls.map(c => c[0])).to.deep.equal(['native']);
    });

    it('stores assigned functions as-is so save/replace/restore keeps working', function () {
      const { window, nativeFetch, polyfill } = setup();
      expect(window.fetch).to.equal(nativeFetch);
      const first = (window.fetch = polyfill, window.fetch);
      const ffetch = () => {};
      const saved = window.fetch;
      window.fetch = ffetch;
      expect(window.fetch).to.equal(ffetch); // FFetch.restoreFetch() compares by identity
      window.fetch = saved;
      expect(window.fetch).to.equal(first);
      window.fetch = nativeFetch;
      expect(window.fetch).to.equal(nativeFetch);
    });

    it('does not recurse when a fetch wrapper saves and calls the previous fetch (FFetch)', async function () {
      const { window, calls, polyfill } = setup();
      window.fetch = polyfill;
      const previous = window.fetch;
      const ffetch = (...args) => previous.apply(window, args);
      window.fetch = ffetch;
      expect(await window.fetch('http://127.0.0.1:1234/okapi/users')).to.equal('mirage');
      expect(await window.fetch('/translations/en.json')).to.equal('native');
      expect(calls.length).to.equal(2);
    });

    it('tolerates fetch being cleared and then polyfilled', function () {
      const { window, polyfill } = setup();
      window.fetch = undefined;
      expect(window.fetch).to.equal(undefined);
      window.fetch = polyfill;
      expect(window.fetch).to.be.a('function');
    });
  });

  describe('resolveRequestFile with the separator-less Windows form', function () {
    it('maps /absoluteC:/Users/... (as emitted by the translations plugin on Windows) onto outDir', function () {
      const winOut = 'C:\\Users\\me\\AppData\\Local\\Temp\\stripes-playwright-abc';
      const url = '/absoluteC:/Users/me/AppData/Local/Temp/stripes-playwright-abc/translations/en-1.json';
      expect(resolveRequestFile(winOut, url)).to.equal(path.join(winOut, 'translations/en-1.json'));
    });

    it('does not treat unrelated paths that merely start with "absolute" as translations', function () {
      expect(resolveRequestFile('/tmp/out', '/absolutely.js')).to.equal(path.join('/tmp/out', 'absolutely.js'));
    });
  });

  describe('buildJunit function', function () {
    beforeEach(function () {
      this.results = [
        { title: 'passes', suite: 'A', state: 'passed', duration: 10 },
        { title: 'fails <badly>', suite: 'A', state: 'failed', duration: 5, err: { message: 'a & b', stack: 'stack' } },
        { title: 'skipped', suite: 'B', state: 'pending' },
      ];
      this.xml = buildJunit(this.results, 'chromium');
    });

    it('reports counts', function () {
      expect(this.xml).to.contain('tests="3" failures="1" skipped="1"');
    });

    it('prefixes the classname with the browser', function () {
      expect(this.xml).to.contain('classname="chromium.A"');
    });

    it('escapes XML characters', function () {
      expect(this.xml).to.contain('name="fails &lt;badly&gt;"');
      expect(this.xml).to.contain('message="a &amp; b"');
    });

    it('marks pending tests as skipped', function () {
      expect(this.xml).to.contain('<skipped/>');
    });
  });

  describe('generateWebpackConfig method', function () {
    beforeEach(function () {
      fs.mkdirSync(path.join(this.tmp, 'tests'));
      fs.writeFileSync(path.join(this.tmp, 'tests/index.js'), '');
      this.input = { entry: ['other'], output: { path: 'elsewhere', publicPath: '/' }, externals: ['existing'], watch: true };
      this.config = new PlaywrightService(this.tmp).generateWebpackConfig(this.input, '/out');
    });

    it('uses the test index as the only entry', function () {
      expect(this.config.entry).to.deep.equal({ tests: path.join(this.tmp, 'tests/index.js') });
    });

    it('writes the bundle to the output directory', function () {
      expect(this.config.output).to.include({ path: '/out', filename: '[name].js', publicPath: '' });
    });

    it('maps mocha to the runner page global and keeps existing externals', function () {
      expect(this.config.externals).to.deep.equal(['existing', { mocha: 'mochaExports' }]);
    });

    it('turns off webpack watching', function () {
      expect(this.config.watch).to.equal(false);
    });

    it('does not modify the incoming config', function () {
      expect(this.input.entry).to.deep.equal(['other']);
    });
  });

  describe('FileFilterPlugin', function () {
    // runs the plugin against a fake context module factory and returns the resulting regExp
    const resolveContext = (plugin, resource, regExp = /(.*?)\/tests\/(.*?)-test/) => {
      let afterResolve;
      plugin.apply({ hooks: { contextModuleFactory: { tap: (n, fn) => fn({ hooks: { afterResolve: { tap: (m, f) => { afterResolve = f; } } } }) } } });
      const data = { resource, regExp };
      afterResolve(data);
      return data.regExp;
    };

    it('accepts an exact file path', function () {
      fs.mkdirSync(path.join(this.tmp, 'lib/Button/tests'), { recursive: true });
      fs.writeFileSync(path.join(this.tmp, 'lib/Button/tests/Button-test.js'), '');
      const re = resolveContext(new FileFilterPlugin(['lib/Button/tests/Button-test.js'], this.tmp), path.join(this.tmp, 'lib'));
      expect(re.test('./Button/tests/Button-test.js')).to.equal(true);
      expect(re.test('./Accordion/tests/Accordion-test.js')).to.equal(false);
    });

    it('treats anything that is not an existing file as a case-insensitive regex on the path', function () {
      const re = resolveContext(new FileFilterPlugin(['button'], this.tmp), path.join(this.tmp, 'lib'));
      expect(re.test('./Button/tests/Button-test.js')).to.equal(true);
      expect(re.test('./ButtonGroup/tests/ButtonGroup-test.js')).to.equal(true);
      expect(re.test('./Accordion/tests/Accordion-test.js')).to.equal(false);
    });

    it('still requires the index\'s own pattern to match', function () {
      const re = resolveContext(new FileFilterPlugin(['button'], this.tmp), path.join(this.tmp, 'lib'));
      expect(re.test('./Button/Button.js')).to.equal(false);
    });

    it('does not filter non-test files, which tests may depend on', function () {
      const re = resolveContext(new FileFilterPlugin(['button'], this.tmp), path.join(this.tmp, 'lib'), /\.js$/);
      expect(re.test('./Icon/Icon.js')).to.equal(true);
      expect(re.test('./Icon/tests/Icon-test.js')).to.equal(false);
      expect(re.test('./Button/tests/Button-test.js')).to.equal(true);
    });

    it('matches any of several filters', function () {
      const re = resolveContext(new FileFilterPlugin(['button', 'accordion'], this.tmp), path.join(this.tmp, 'lib'));
      expect(re.test('./Accordion/tests/Accordion-test.js')).to.equal(true);
      expect(re.test('./Icon/tests/Icon-test.js')).to.equal(false);
    });

    it('gives differently-filtered contexts a different source', function () {
      const a = resolveContext(new FileFilterPlugin(['button'], this.tmp), path.join(this.tmp, 'lib'));
      const b = resolveContext(new FileFilterPlugin(['icon'], this.tmp), path.join(this.tmp, 'lib'));
      expect(a.source).to.not.equal(b.source);
    });

    it('leaves node_modules contexts alone', function () {
      const original = /locale/;
      const re = resolveContext(new FileFilterPlugin(['button'], this.tmp), path.join(this.tmp, 'node_modules', 'moment', 'locale'), original);
      expect(re).to.equal(original);
    });

    it('rejects an invalid regular expression', function () {
      expect(() => new FileFilterPlugin(['('], this.tmp)).to.throw(/regular expression/);
    });
  });

  describe('generateWebpackConfig with files', function () {
    it('adds the FileFilterPlugin only when files are given', function () {
      fs.mkdirSync(path.join(this.tmp, 'tests'));
      fs.writeFileSync(path.join(this.tmp, 'tests/index.js'), '');
      const service = new PlaywrightService(this.tmp);
      expect(service.generateWebpackConfig({ plugins: [] }, '/out').plugins).to.have.length(0);
      const plugins = service.generateWebpackConfig({ plugins: [] }, '/out', ['a-test.js']).plugins;
      expect(plugins[0]).to.be.instanceOf(FileFilterPlugin);
    });
  });

  describe('source locations', function () {
    describe('toRelativePath function', function () {
      it('strips a namespace that contains a slash and the loader query', function () {
        expect(toRelativePath('webpack://@folio/stripes-components/./lib/Button/Button.js?ab12', '/work')).to.equal('lib/Button/Button.js');
      });

      it('keeps files outside of the project relative', function () {
        expect(toRelativePath('webpack://app/../stripes-core/index.js', path.resolve('/work/app'))).to.equal('../stripes-core/index.js');
      });

      it('ignores webpack internals and externals', function () {
        expect(toRelativePath('webpack://app/webpack/bootstrap', '/work')).to.equal(undefined);
        expect(toRelativePath('external "mocha"', '/work')).to.equal(undefined);
        expect(toRelativePath(undefined, '/work')).to.equal(undefined);
      });
    });

    describe('sourceLocator function', function () {
      const fakeMap = { findOrigin: (line, column) => ({ fileName: 'webpack://app/./lib/A-test.js', lineNumber: line - 100, columnNumber: column }) };

      it('maps bundle positions to file:line', function () {
        expect(sourceLocator(fakeMap, '/work')(150, 7)).to.equal('lib/A-test.js:50');
      });

      it('returns undefined without a source map or position', function () {
        expect(sourceLocator(null, '/work')(150, 7)).to.equal(undefined);
        expect(sourceLocator(fakeMap, '/work')(undefined, undefined)).to.equal(undefined);
      });
    });

    describe('mapStack function', function () {
      const locate = (line, column) => (line === 150 ? 'lib/A-test.js:50' : undefined);

      it('replaces bundle frames, with or without the host', function () {
        const stack = 'Error: x\n    at fn (http://127.0.0.1:1234/tests.js:150:7)\n    at Context.<anonymous> (tests.js:150:9)';
        expect(mapStack(stack, locate)).to.equal('Error: x\n    at fn (lib/A-test.js:50)\n    at Context.<anonymous> (lib/A-test.js:50)');
      });

      it('leaves frames it cannot map', function () {
        expect(mapStack('at x (tests.js:999:1)', locate)).to.equal('at x (tests.js:999:1)');
        expect(mapStack(undefined, locate)).to.equal('');
      });
    });

    it('generateWebpackConfig emits a source map', function () {
      fs.mkdirSync(path.join(this.tmp, 'tests'));
      fs.writeFileSync(path.join(this.tmp, 'tests/index.js'), '');
      expect(new PlaywrightService(this.tmp).generateWebpackConfig({}, '/out').devtool).to.equal('cheap-module-source-map');
    });
  });
});
