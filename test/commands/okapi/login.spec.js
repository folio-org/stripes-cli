const expect = require('chai').expect;

const AuthService = require('../../../lib/okapi/auth-service');
const loginCommand = require('../../../lib/commands/okapi/login');

const authServiceStub = {
  login: (username, password) => {
    if (password === 'correct-password') {
      return Promise.resolve();
    } else {
      return Promise.reject('uh-oh!');
    }
  },
};

describe('The Okapi login command', function () {
  beforeEach(function () {
    this.argv = {
      username: 'user',
      password: 'correct-password',
      okapi: 'http://localhost:9130',
      tenant: 'diku',
    };
    this.sut = loginCommand;
    this.sandbox.stub(AuthService.prototype, 'login').callsFake(authServiceStub.login);
    this.sandbox.spy(console, 'log');
  });

  it('calls auth service with credentials', function (done) {
    this.sut.handler(this.argv)
      .then(() => {
        expect(AuthService.prototype.login).to.have.been.calledWith('user', 'correct-password');
        done();
      });
  });

  it('reports login failure', function (done) {
    this.argv.password = 'wrong-password';
    this.sut.handler(this.argv)
      .then(() => {
        expect(console.log).to.have.been.calledWith('Error logging in.');
        done();
      });
  });
});
