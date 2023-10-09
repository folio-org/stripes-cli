const expect = require('chai').expect;
const Configstore = require('configstore');

const TokenStorage = require('../../lib/okapi/token-storage');

describe('token-storage', function () {
  beforeEach(function () {
    this.sut = new TokenStorage();
    this.sut.config = new Configstore('key', {});
    this.sut.tokenKey = 'okapi.token';
    this.sut.accessCookieKey = 'okapi.accessCookie';
    this.sut.refreshCookieKey = 'okapi.refreshCookie';
  });

  it('setToken', function () {
    this.sandbox.stub(this.sut.config, 'set').callsFake(() => {});

    this.sut.setToken('foo');
    expect(this.sut.config.set).to.have.been.calledWith(this.sut.tokenKey, 'foo');
  });

  it('getToken', function () {
    this.sut.setToken('foo');
    expect(this.sut.getToken()).to.equal('foo');
  });

  it('clearToken', function () {
    this.sut.setToken('foo');
    this.sut.clearToken();
    expect(this.sut.getToken('foo')).to.equal('');
  });

  it('setAccessCookie', function () {
    this.sandbox.stub(this.sut.config, 'set').callsFake(() => {});

    this.sut.setAccessCookie('foo');
    expect(this.sut.config.set).to.have.been.calledWith(this.sut.accessCookieKey, 'foo');
  });

  it('getAccessCookie', function () {
    this.sut.setAccessCookie('foo');
    expect(this.sut.getAccessCookie()).to.equal('foo');
  });

  it('clearAccessCookie', function () {
    this.sut.setAccessCookie('foo');
    this.sut.clearAccessCookie();
    expect(this.sut.getAccessCookie('foo')).to.equal('');
  });

  it('setRefreshCookie', function () {
    this.sandbox.stub(this.sut.config, 'set').callsFake(() => {});

    this.sut.setRefreshCookie('foo');
    expect(this.sut.config.set).to.have.been.calledWith(this.sut.refreshCookieKey, 'foo');
  });

  it('getRefreshCookie', function () {
    this.sut.setRefreshCookie('foo');
    expect(this.sut.getRefreshCookie()).to.equal('foo');
  });

  it('clearRefreshCookie', function () {
    this.sut.setRefreshCookie('foo');
    this.sut.clearRefreshCookie();
    expect(this.sut.getRefreshCookie('foo')).to.equal('');
  });
});
