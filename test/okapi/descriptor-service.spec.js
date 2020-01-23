const expect = require('chai').expect;
const fs = require('fs');

const DescriptorService = require('../../lib/okapi/descriptor-service');

const platformContext = {
  isPlatform: true,
  cwd: 'path/to/platform-example'
};

const uiModuleContext = {
  isUiModule: true,
  cwd: 'path/to/ui-example'
};

const backendModuleContext = {
  isBackendModule: true,
  cwd: 'path/to/mod-example'
};

const packageJsonStub = {
  name: '@folio/example',
  description: 'Example module',
  version: '1.2.3',
  stripes: {
    type: 'app',
    okapiInterfaces: {
      backend: '2.0',
    },
    permissionSets: [
      {
        permissionName: 'module.example.enabled',
        displayName: 'Example module is enabled',
      },
    ]
  }
};

const tenantConfig = {
  okapi: {
    url: 'http://localhost:9130',
    tenant: 'diku',
  },
  modules: {
    '@folio/one': {},
    '@folio/two': {},
  }
};

function StripesModuleParserStub(name) {
  this.packageJson = { ...packageJsonStub, name };
}

const stripesCoreStub = {
  api: {
    StripesModuleParser: StripesModuleParserStub,
  }
};

const platformStub = {
  getStripesConfig: () => tenantConfig,
  getStripesCore: () => stripesCoreStub,
};

const backendModuleDescriptorStub = {
  id: 'mod-backend-1.2.3',
  name: 'Backend module',
  provides: [
    { id: 'backend', version: '2.0' },
  ],
  requires: [],
  permissionSets: [],
};

describe('The descriptor-service', function () {
  describe('constructor', function () {
    it('accepts a context and tenant config', function () {
      const sut = new DescriptorService(platformContext, tenantConfig);
      expect(sut.context).to.equal(platformContext);
      expect(sut.stripesConfig).to.equal(tenantConfig);
    });
  });

  describe('getUiModuleDescriptor method', function () {
    beforeEach(function () {
      this.sut = new DescriptorService(uiModuleContext);
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(packageJsonStub));
    });

    it('generates descriptor for a ui-module', function (done) {
      const expected = [{
        id: 'folio_example-1.2.3',
        name: 'Example module',
        permissionSets: [
          {
            permissionName: 'module.example.enabled',
            displayName: 'Example module is enabled'
          }
        ]
      }];

      const output = this.sut.getUiModuleDescriptor();
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });

    it('generates descriptor for a ui-module with required interfaces', function (done) {
      const expected = [{
        id: 'folio_example-1.2.3',
        name: 'Example module',
        permissionSets: [
          {
            permissionName: 'module.example.enabled',
            displayName: 'Example module is enabled'
          }
        ],
        requires: [
          {
            id: 'backend',
            version: '2.0'
          }
        ]
      }];

      const output = this.sut.getUiModuleDescriptor(true);
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });
  });

  describe('getUiPlatformModuleDescriptors method', function () {
    beforeEach(function () {
      this.sut = new DescriptorService(platformContext, tenantConfig);
      this.sut.platform = platformStub;
      this.sut.stripesCore = stripesCoreStub;
    });

    it('generates descriptors for a platform', function (done) {
      const expected = ['one', 'two', 'stripes-smart-components', 'stripes-core'].map(name => {
        return {
          id: `folio_${name}-1.2.3`,
          name: 'Example module',
          permissionSets: [
            {
              permissionName: 'module.example.enabled',
              displayName: 'Example module is enabled'
            }
          ]
        };
      });

      const output = this.sut.getUiPlatformModuleDescriptors();
      expect(output).to.be.an('array').with.lengthOf(4);
      expect(output).to.deep.equal(expected);
      done();
    });

    it('generates descriptors for a platform with required interfaces', function (done) {
      const expected = ['one', 'two', 'stripes-smart-components', 'stripes-core'].map(name => {
        return {
          id: `folio_${name}-1.2.3`,
          name: 'Example module',
          permissionSets: [
            {
              permissionName: 'module.example.enabled',
              displayName: 'Example module is enabled'
            }
          ],
          requires: [
            {
              id: 'backend',
              version: '2.0'
            }
          ]
        };
      });

      const output = this.sut.getUiPlatformModuleDescriptors(true);
      expect(output).to.be.an('array').with.lengthOf(4);
      expect(output).to.deep.equal(expected);
      done();
    });
  });

  describe('getBackendModuleDescriptor method', function () {
    beforeEach(function () {
      this.sut = new DescriptorService(backendModuleContext);
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(backendModuleDescriptorStub));
    });

    it('loads descriptor for a backend module', function (done) {
      const output = this.sut.getBackendModuleDescriptor();
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output[0]).to.deep.equal(backendModuleDescriptorStub);
      done();
    });
  });

  describe('extendModuleDescriptorIds method', function () {
    it('adds modules given prerequisites are met', function (done) {
      const input = ['folio_search', 'folio_inventory'];
      const output = DescriptorService.extendModuleDescriptorIds(input);
      expect(output).to.be.an('array').with.lengthOf(3);
      expect(output).to.include.members(['folio_search', 'folio_inventory', 'mod-codex-inventory']);
      done();
    });

    it('does not add modules without prerequisites', function (done) {
      const input = ['folio_one', 'folio_inventory'];
      const output = DescriptorService.extendModuleDescriptorIds(input);
      expect(output).to.be.an('array').with.lengthOf(2);
      expect(output).to.include.members(['folio_one', 'folio_inventory']);
      done();
    });

    it('appends additional module ids', function (done) {
      const input = ['folio_one', 'folio_two'];
      const output = DescriptorService.extendModuleDescriptorIds(input, ['folio_three']);
      expect(output).to.be.an('array').with.lengthOf(3);
      expect(output).to.include.members(['folio_one', 'folio_two', 'folio_three']);
      done();
    });
  });
});
