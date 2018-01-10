const expect = require('chai').expect;

const AuthService = require('../../../lib/okapi/auth-service');
const logoutCommand = require('../../../lib/commands/okapi-commands/logout');

const authServiceStub = {
  logout: () => Promise.resolve(),
};

describe('The Okapi logout command', function () {
  beforeEach(function () {
    this.argv = {
      okapi: 'http://localhost:9130',
      tenant: 'diku',
    };
    this.sut = logoutCommand;
    this.sandbox.stub(AuthService.prototype, 'logout').callsFake(authServiceStub.logout);
  });

  it('calls authService.logout', function (done) {
    this.sut.handler(this.argv)
      .then(() => {
        expect(AuthService.prototype.logout).to.have.been.calledOnce;
        done();
      });
  });
});
