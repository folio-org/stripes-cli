const expect = require('chai').expect;
const webpackCommon = require('../lib/webpack-common');
const path = require('path');

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
    });

    it('returns a function', function () {
      const webpackOverride = this.sut.cliResolve();
      expect(webpackOverride).to.be.a('function');
    });

    it('updates entry for an aliased stripes-core (platform core available)', function () {
      const webpackOverride = this.sut.cliResolve(true, '/alias/path/to/@folio/stripes-core');
      const result = webpackOverride(this.inputConfig);
      expect(result).to.have.property('entry').that.includes('/alias/path/to/@folio/stripes-core/src/index');
      expect(result).to.have.property('entry').that.does.not.include('/original/path/to/@folio/stripes-core/src/index');
    });

    it('updates entry for an aliased stripes-core (platform core not available)', function () {
      const webpackOverride = this.sut.cliResolve(false, '/alias/path/to/@folio/stripes-core');
      const result = webpackOverride(this.inputConfig);
      expect(result).to.have.property('entry').that.includes('/alias/path/to/@folio/stripes-core/src/index');
      expect(result).to.have.property('entry').that.does.not.include('/original/path/to/@folio/stripes-core/src/index');
    });

    it('updates resolve modules for an aliased stripes-core', function () {
      const webpackOverride = this.sut.cliResolve(true, '/alias/path/to/@folio/stripes-core');
      const result = webpackOverride(this.inputConfig);

      expect(result.resolve.modules).to.include('/alias/path/to/@folio/stripes-core/node_modules');
      expect(result.resolveLoader.modules).to.include('/alias/path/to/@folio/stripes-core/node_modules');
    });

    it('updates entry for the platform\'s stripes-core (platform core available)', function () {
      const webpackOverride = this.sut.cliResolve(true, '');
      const result = webpackOverride(this.inputConfig);
      expect(result.entry).to.match(/node_modules\/@folio\/stripes-core\/src\/index/);
      expect(result).to.have.property('entry').that.does.not.include('/original/path/to/@folio/stripes-core/src/index');
    });

    it('updates resolve modules for the CLI\'s stripes-core (platform core not available)', function () {
      const webpackOverride = this.sut.cliResolve(false, '');
      const result = webpackOverride(this.inputConfig);
      expect(result).to.have.property('entry').that.includes('/original/path/to/@folio/stripes-core/src/index');

      const cliNodeModulePath = path.join(__dirname, '..', 'node_modules');
      expect(result.resolve.modules).to.include(cliNodeModulePath);
      expect(result.resolveLoader.modules).to.include(cliNodeModulePath);
    });
  });
});
