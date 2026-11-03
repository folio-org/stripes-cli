import sinon from 'sinon';
import { use } from 'chai';
import sinonChai from 'sinon-chai';

// Test setup for Mocha tests
// Root-level Mocha hooks defined here apply to all tests regardless of file.


before(function () {
  use(sinonChai);
});

beforeEach(function () {
  // The Sinon sandbox allows for easy cleanup of spies and stubs
  this.sandbox = sinon.createSandbox();
});

afterEach(function () {
  this.sandbox.restore();
});
