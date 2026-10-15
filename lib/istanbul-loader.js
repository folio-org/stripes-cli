// webpack loader that adds istanbul coverage instrumentation to already-transpiled code.
// it is meant to run as a post-loader, i.e. after esbuild-loader, which has no coverage
// support of its own: https://github.com/evanw/esbuild/issues/184
const { createInstrumenter } = require('istanbul-lib-instrument');

const instrumenter = createInstrumenter({
  esModules: true,
  compact: false,
  produceSourceMap: true,
  autoWrap: true,
});

module.exports = function istanbulLoader(source, inputSourceMap) {
  const callback = this.async();
  instrumenter.instrument(source, this.resourcePath, (err, code) => {
    if (err) {
      callback(err);
    } else {
      callback(null, code, instrumenter.lastSourceMap() || inputSourceMap);
    }
  }, inputSourceMap || undefined);
};
