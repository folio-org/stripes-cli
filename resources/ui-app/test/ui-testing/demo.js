/* global Nightmare, describe, it, before, after */

module.exports.test = (uiTestCtx) => {
  describe('Module test: <%= uiAppName %>:hello', () => {
    const { config, helpers: { login, logout } } = uiTestCtx;
    const nightmare = new Nightmare(config.nightmare);

    this.timeout(Number(config.test_timeout));

    describe('Login > navigate to app > verify message > logout', () => {
      before((done) => {
        login(nightmare, config, done);
      });
      after((done) => {
        logout(nightmare, config, done);
      });
      it('should open app and see demo message', (done) => {
        nightmare
          .wait('#clickable-<%= appName %>-module')
          .click('#clickable-<%= appName %>-module')
          .wait('#<%= appName %>-module-display')
          .wait('#demo-message')
          .then(() => { done(); })
          .catch(done);
      });
    });

    describe('Login > navigate to app settings > verify message > logout', () => {
      before((done) => {
        login(nightmare, config, done);
      });
      after((done) => {
        logout(nightmare, config, done);
      });
      it('should open app settings', (done) => {
        nightmare
          .wait(config.select.settings)
          .click(config.select.settings)
          .wait('a[href="/settings/<%= appRoute %>"]')
          .click('a[href="/settings/<%= appRoute %>"]')
          .wait(2222)
          .wait('#demo-settings-message')
          .then(() => { done(); })
          .catch(done);
      });
    });
  });
};
