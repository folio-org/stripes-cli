import chaiMod from 'chai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import PlaywrightService, { getTestIndex, buildJunit, FileFilterPlugin } from '../../lib/test/playwright-service.js';

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
});
