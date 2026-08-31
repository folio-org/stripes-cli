const expect = require('chai').expect;
const webpackCommon = require('../lib/webpack-common');

describe('The webpack-common module', function () {
  beforeEach(function () {
    this.sut = webpackCommon;
  });

  describe('cliResolve function', function () {
    beforeEach(function () {
      this.inputConfig = {
        entry: [
          '/original/path/to/@folio/stripes-core/src/index',
        ],
        resolve: {
          modules: [],
        },
        resolveLoader: {
          modules: [],
        },
      };
      this.context = {
        isGlobalInstall: false,
        globalPackagesDir: 'path/to/global/npm_modules',
      };
    });

    it('returns a function', function () {
      const webpackOverride = this.sut.cliResolve();
      expect(webpackOverride).to.be.a('function');
    });

    it('updates resolve modules for global installs', function () {
      this.context.isGlobalInstall = true;
      const webpackOverride = this.sut.cliResolve(this.context);
      const result = webpackOverride(this.inputConfig);

      expect(result.resolve.modules).to.include('path/to/global/npm_modules');
      expect(result.resolveLoader.modules).to.include('path/to/global/npm_modules');
    });

    it('does not update resolve modules for other installs', function () {
      const webpackOverride = this.sut.cliResolve(this.context);
      const result = webpackOverride(this.inputConfig);

      expect(result.resolve.modules).to.not.include('path/to/global/npm_modules');
      expect(result.resolveLoader.modules).to.not.include('path/to/global/npm_modules');
    });
  });

  describe('ignoreCache', () => {
    it('"--cache false" turns off caching', () => {
      expect(webpackCommon.ignoreCache({})).to.eql({ cache: false });
    });
  });
});
