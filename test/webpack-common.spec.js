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

describe('The webpack-common coverage and decorator helpers', function () {
  const esbuildUse = () => ({ loader: '/node_modules/esbuild-loader/dist/index.js', options: { loader: 'tsx' } });
  const makeConfig = () => ({ module: { rules: [{ test: /\.js$/, use: [esbuildUse()] }, { test: /\.css$/, use: [{ loader: 'css-loader' }] }] } });

  describe('enableLegacyDecorators function', function () {
    it('enables experimentalDecorators on the esbuild loader and keeps its options', function () {
      const config = webpackCommon.enableLegacyDecorators(makeConfig());
      const options = config.module.rules[0].use[0].options;
      expect(options.loader).to.equal('tsx');
      expect(options.tsconfigRaw.compilerOptions.experimentalDecorators).to.equal(true);
    });

    it('leaves other loaders alone', function () {
      const config = webpackCommon.enableLegacyDecorators(makeConfig());
      expect(config.module.rules[1].use[0]).to.deep.equal({ loader: 'css-loader' });
    });
  });

  describe('enableCoverage function', function () {
    it('adds the istanbul babel loader after esbuild in the pipeline', function () {
      const config = webpackCommon.enableCoverage(makeConfig());
      const use = config.module.rules[0].use;
      expect(use).to.have.length(2);
      expect(use[0].loader).to.contain('babel-loader');
      expect(use[0].options.plugins[0][0]).to.contain('babel-plugin-istanbul');
      expect(use[1].loader).to.contain('esbuild-loader');
    });

    it('leaves non-esbuild rules alone', function () {
      const config = webpackCommon.enableCoverage(makeConfig());
      expect(config.module.rules[1].use).to.have.length(1);
    });

    it('throws when there is no esbuild rule to instrument', function () {
      expect(() => webpackCommon.enableCoverage({ module: { rules: [] } })).to.throw(/esbuild-loader/);
    });
  });
});
