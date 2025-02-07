// Test setup for Mocha tests
// Root-level Mocha hooks defined here apply to all tests regardless of file.

import sinon from 'sinon';

import chai from 'chai';
import sinonChai from 'sinon-chai';

before(function () {
  chai.use(sinonChai);
});

beforeEach(function () {
  // The Sinon sandbox allows for easy cleanup of spies and stubs
  this.sandbox = sinon.createSandbox();
});

afterEach(function () {
  this.sandbox.restore();
});
