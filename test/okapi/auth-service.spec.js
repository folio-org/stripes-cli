const expect = require('chai').expect;

const AuthService = require('../../lib/okapi/auth-service');

const authnStub = {
  login: (username, password) => {
    if (password === 'correct-password') {
      return Promise.resolve({
        ok: true,
        headers: {
          get: (x) => `value for ${x}`,
          raw: () => ({
            'set-cookie': []
          })
        }
      });
    } else if (password === 'correct-cookie') {
      return Promise.resolve({
        ok: true,
        headers: {
          get: () => null,
          raw: () => ({
            'set-cookie': [
              'folioAccessToken=access_token; Max-Age=600; Expires=Fri, 08 Sep 2023 18:18:13 GMT; Path=/; Secure; HTTPOnly; SameSite=None',
              'folioRefreshToken=refresh_token; Max-Age=604800; Expires=Fri, 15 Sep 2023 18:08:13 GMT; Path=/authn; Secure; HTTPOnly; SameSite=None'
            ],
          }),
        }
      });
    } else if (password === 'wrong-password') {
      return Promise.reject('okapi says uh-oh!');
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
      this.sandbox.stub(this.sut.tokenStorage, 'clearToken').callsFake(() => {});

      this.sandbox.stub(this.sut.tokenStorage, 'setAccessCookie').callsFake(() => {});
      this.sandbox.stub(this.sut.tokenStorage, 'clearAccessCookie').callsFake(() => {});
      this.sandbox.stub(this.sut.tokenStorage, 'setRefreshCookie').callsFake(() => {});
      this.sandbox.stub(this.sut.tokenStorage, 'clearRefreshCookie').callsFake(() => {});
    });

    it('clears prior token', function (done) {
      this.sut.login('user', 'correct-password')
        .then(() => {
          expect(this.sut.tokenStorage.clearToken).to.have.been.calledOnce;
          expect(this.sut.tokenStorage.clearAccessCookie).to.have.been.calledOnce;
          expect(this.sut.tokenStorage.clearRefreshCookie).to.have.been.calledOnce;
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

    describe('token', () => {
      it('sets token upon successful login', function (done) {
        this.sut.login('user', 'correct-password')
          .then(() => {
            expect(authnStub.login).to.have.been.calledOnce;
            expect(this.sut.tokenStorage.setToken).to.have.been.calledOnce;
            done();
          });
      });
    });

    describe('cookie', () => {
      it('sets cookies upon successful login', function (done) {
        this.sut.login('user', 'correct-cookie')
          .then(() => {
            expect(authnStub.login).to.have.been.calledOnce;
            expect(this.sut.tokenStorage.setAccessCookie).to.have.been.calledOnce;
            expect(this.sut.tokenStorage.setRefreshCookie).to.have.been.calledOnce;
            expect(this.sut.tokenStorage.setToken).to.not.have.been.called;
            done();
          });
      });
    });

    it('throws okapi message on okapi rejection', function (done) {
      this.sut.login('user', 'wrong-password')
        .catch((err) => {
          expect(err).to.equal('okapi says uh-oh!');
          expect(this.sut.tokenStorage.setToken).to.not.have.been.called;
          expect(this.sut.tokenStorage.setAccessCookie).to.not.have.been.calledOnce;
          expect(this.sut.tokenStorage.setRefreshCookie).to.not.have.been.calledOnce;
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


  describe('retrieves tokens', async function () {
    it('token', async function () {
      this.sut = new AuthService();
      this.sandbox.stub(this.sut.tokenStorage, 'getToken').callsFake(() => true);

      await this.sut.getToken();
      expect(this.sut.tokenStorage.getToken).to.have.been.calledOnce;
    });

    it('access token (cookie)', async function () {
      this.sut = new AuthService();
      this.sandbox.stub(this.sut.tokenStorage, 'getAccessCookie').callsFake(() => true);

      await this.sut.getAccessCookie();
      expect(this.sut.tokenStorage.getAccessCookie).to.have.been.calledOnce;
    });

    it('refresh token (cookie)', async function () {
      this.sut = new AuthService();
      this.sandbox.stub(this.sut.tokenStorage, 'getRefreshCookie').callsFake(() => true);

      await this.sut.getRefreshCookie();
      expect(this.sut.tokenStorage.getRefreshCookie).to.have.been.calledOnce;
    });
  });
});
