import chaiMod from 'chai';
import getStripesWebpackConfig from '../../lib/test/webpack-config.js';

const expect = chaiMod.expect;

function stubCore() {
  const modules = {
    'webpack/stripes-webpack-plugin': class StripesWebpackPlugin {},
    'webpack/apply-webpack-overrides': (overrides, config) => config,
    'webpack.config.cli.dev': () => ({
      entry: ['webpack-hot-middleware/client'],
      plugins: [],
      resolve: { modules: [] },
      module: { rules: [{ use: [{ loader: '/x/esbuild-loader/dist/index.js', options: { target: 'es2020' } }] }] },
    }),
    'webpack.config.cli.shared.styles': (config) => config,
  };
  return { corePath: '/core', getCoreModule: (name) => modules[name] };
}

const esbuildOptions = (config) => config.module.rules[0].use[0].options;

describe('The test webpack-config', function () {
  it('does not enable legacy decorators by default (Karma flow)', function () {
    const config = getStripesWebpackConfig(stubCore(), {}, { omitPlatform: true }, {});
    expect(esbuildOptions(config).tsconfigRaw).to.equal(undefined);
  });

  it('enables legacy decorators when requested (Playwright flow)', function () {
    const config = getStripesWebpackConfig(stubCore(), {}, { omitPlatform: true, legacyDecorators: true }, {});
    expect(esbuildOptions(config).tsconfigRaw.compilerOptions.experimentalDecorators).to.equal(true);
    expect(esbuildOptions(config).target).to.equal('es2020');
  });
});
