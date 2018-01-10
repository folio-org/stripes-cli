const expect = require('chai').expect;

const AuthService = require('../../lib/okapi/auth-service');

const authnStub = {
  login: (username, password) => {
    if (password === 'correct-password') {
      return Promise.resolve({ ok: true, headers: { get: x => `value for header ${x}` } });
    } else if (password === 'wrong-password') {
      return Promise.resolve({ text: () => Promise.resolve('okapi says uh-oh!') });
    } else {
      return Promise.reject('other-error');
    }
  },
};

describe('The auth-service', function () {
  describe('constructor', function () {
    it('accepts an okapi repository', function () {
      const okapiRepository = {};
      const sut = new AuthService(okapiRepository);
      expect(sut.okapi).to.equal(okapiRepository);
    });

    it('initializes token storage', function () {
      const sut = new AuthService();
      expect(sut.tokenStorage).to.be.an('object').with.property('setToken');
    });
  });

  describe('login method', function () {
    beforeEach(function () {
      this.sut = new AuthService({ authn: authnStub });
      this.sandbox.spy(authnStub, 'login');
      this.sandbox.stub(this.sut.tokenStorage, 'setToken').callsFake(() => {});
      this.sandbox.stub(this.sut.tokenStorage, 'getToken').callsFake(() => {});
      this.sandbox.stub(this.sut.tokenStorage, 'clearToken').callsFake(() => {});
    });

    it('clears prior token', function (done) {
      this.sut.login('user', 'correct-password')
        .then(() => {
          expect(this.sut.tokenStorage.clearToken).to.have.been.calledOnce;
          done();
        });
    });

    it('calls okapi.authn.login', function (done) {
      this.sut.login('user', 'correct-password')
        .then(() => {
          expect(authnStub.login).to.have.been.calledWith('user', 'correct-password');
          done();
        });
    });

    it('sets token upon successful login', function (done) {
      this.sut.login('user', 'correct-password')
        .then(() => {
          expect(authnStub.login).to.have.been.calledOnce;
          expect(this.sut.tokenStorage.setToken).to.have.been.calledOnce;
          done();
        });
    });

    it('throws okapi message on okapi rejection', function (done) {
      this.sut.login('user', 'wrong-password')
        .catch((err) => {
          expect(err).to.equal('okapi says uh-oh!');
          expect(this.sut.tokenStorage.setToken).to.not.have.been.called;
          done();
        });
    });

    it('does not set token on client/network failure', function (done) {
      this.sut.login('user', 'this will fail')
        .catch((err) => {
          expect(err).to.equal('other-error');
          expect(this.sut.tokenStorage.setToken).to.not.have.been.called;
          done();
        });
    });
  });

  describe('logout method', function () {
    it('clears the token', function (done) {
      const sut = new AuthService();
      this.sandbox.stub(sut.tokenStorage, 'clearToken').callsFake(() => {});
      sut.logout()
        .then(() => {
          expect(sut.tokenStorage.clearToken).to.have.been.calledOnce;
          done();
        });
    });
  });
});
