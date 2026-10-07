const expect = require('chai').expect;
const fs = require('fs');
const os = require('os');
const path = require('path');
const PlaywrightService = require('../../lib/test/playwright-service');

const { getTestIndex, buildJunit } = PlaywrightService;

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
});
