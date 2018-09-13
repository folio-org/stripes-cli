const expect = require('chai').expect;
const context = require('../../lib/cli/context');
const path = require('path');

const createModule = (type) => ({
  name: 'moduleName',
  stripes: {
    type,
  }
});

describe('The CLI\'s getContext', function () {
  beforeEach(function () {
    this.sut = context.getContext;
  });

  describe('parses stripes.type from package.json', function () {
    it('is ui module with type "app"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('app'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'app',
        isStripesModule: false,
        isUiModule: true,
        isPlatform: false,
      });
    });

    it('is ui module with type "settings"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('settings'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'settings',
        isStripesModule: false,
        isUiModule: true,
        isPlatform: false,
      });
    });

    it('is ui module with type "components"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('components'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'components',
        isStripesModule: true,
        isUiModule: false,
        isPlatform: false,
      });
    });
  });

  it('identifies platforms', function () {
    this.sandbox.stub(context, 'require').returns({
      name: '@folio/platform-core',
      dependencies: { '@folio/stripes-core': '1.2.3' }
    });
    const result = this.sut('someDir');

    expect(result).to.include({
      type: 'platform',
      isStripesModule: false,
      isUiModule: false,
      isPlatform: true,
    });
  });

  it('identifies workspaces', function () {
    this.sandbox.stub(context, 'require').returns({
      workspaces: [],
    });
    const result = this.sut('someDir');

    expect(result).to.include({
      type: 'workspace',
      isStripesModule: false,
      isUiModule: false,
      isPlatform: false,
    });
  });

  it('identifies itself', function () {
    this.sandbox.stub(context, 'require').returns({
      name: '@folio/stripes-cli',
    });
    const result = this.sut(path.resolve(__dirname, '../..'));

    expect(result).to.include({
      type: 'cli',
      isStripesModule: false,
      isUiModule: false,
      isPlatform: false,
    });
  });

  it('handles no package.json', function () {
    this.sandbox.stub(context, 'require').throws();
    const result = this.sut('someDir');

    expect(result).to.include({
      type: 'empty',
      isStripesModule: false,
      isUiModule: false,
      isPlatform: false,
    });
  });

  it('identifies when a local stripes-core is available', function () {
    this.sandbox.stub(context, 'require').returns({
      name: '@folio/platform-core',
      dependencies: { '@folio/stripes-core': '1.2.3' }
    });
    const result = this.sut('someDir');

    expect(result).to.include({
      isLocalCoreAvailable: true,
    });
  });

  it('identifies when a local stripes-core is not available', function () {
    this.sandbox.stub(context, 'require').returns({
      name: '@folio/platform-core',
      dependencies: { '@folio/not-stripes-core': '1.2.3' }
    });
    const result = this.sut('someDir');

    expect(result).to.include({
      isLocalCoreAvailable: false,
    });
  });

});
