const expect = require('chai').expect;

const istanbulLoader = require('../../lib/istanbul-loader');

// run the loader the way webpack would, resolving with its (err, code, map) callback args
function runLoader(source, inputSourceMap) {
  return new Promise((resolve) => {
    const context = {
      resourcePath: '/project/src/example.js',
      async: () => (err, code, map) => resolve({ err, code, map }),
    };
    istanbulLoader.call(context, source, inputSourceMap);
  });
}

describe('The istanbul loader', function () {
  it('adds coverage counters to ES module source', async function () {
    const { err, code } = await runLoader('export const add = (a, b) => a + b;');

    expect(err).to.equal(null);
    expect(code).to.include('__coverage__');
    expect(code).to.include('/project/src/example.js');
    expect(code).to.include('export const add');
  });

  it('emits a source map', async function () {
    const { map } = await runLoader('export const add = (a, b) => a + b;');

    expect(map).to.be.an('object');
    expect(map).to.have.property('mappings');
  });

  it('passes syntax errors to the callback', async function () {
    const { err, code } = await runLoader('export const = ;');

    expect(err).to.be.an('error');
    expect(code).to.equal(undefined);
  });
});
