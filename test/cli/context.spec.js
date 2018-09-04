const expect = require('chai').expect;
const context = require('../../lib/cli/context');

const createModule = (type) => ({
  name: 'moduleName',
  stripes: {
    type,
  }
});

describe('context', function () {
  beforeEach(function () {
    this.sut = context.getContext;
  });

  describe('stripes', function () {
    it('is ui module with type "app"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('app'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'app',
        isStripesModule: false,
        isUiModule: true,
      });
    });

    it('is ui module with type "settings"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('settings'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'settings',
        isStripesModule: false,
        isUiModule: true,
      });
    });

    it('is ui module with type "components"', function () {
      this.sandbox.stub(context, 'require').returns(createModule('components'));

      const result = this.sut('someDir');

      expect(result).to.include({
        type: 'components',
        isStripesModule: true,
        isUiModule: false,
      });
    });
  });
});
