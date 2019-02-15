const expect = require('chai').expect;
const sinon = require('sinon');

const ModuleService = require('../../lib/okapi/module-service');
const OkapiError = require('../../lib/okapi/okapi-error');

const okapiResolve = (data) => Promise.resolve({ json: () => data });
const okapiReject = (message) => Promise.reject(new OkapiError({}, message));

const okapiStub = {
  proxy: {
    addModuleDescriptor: (descriptor) => {
      if (descriptor.id === 'mod-existing') {
        return okapiReject('already exists');
      }
      return okapiResolve({});
    },
    removeModuleDescriptor: (id) => {
      if (id === 'mod-not-here') {
        return okapiReject('module does not exist');
      }
      return okapiResolve({});
    },
    enableModuleForTenant: (id) => {
      if (id === 'mod-enabled') {
        return okapiReject('already provided');
      }
      return okapiResolve({});
    },
    disableModuleForTenant: () => okapiResolve({}),
    getModulesForTenant: () => okapiResolve([{ id: 'mod-one' }, { id: 'mod-two' }, { id: 'mod-three' }]),
    getModules: () => okapiResolve([{ id: 'mod-one' }, { id: 'mod-two' }, { id: 'mod-three' }, { id: 'mod-four' }, { id: 'mod-five' }]),
    getModulesThatRequireInterface: () => okapiResolve([{ id: 'mod-one' }, { id: 'mod-two' }]),
    getModulesThatProvideInterface: () => okapiResolve([{ id: 'mod-four' }, { id: 'mod-five' }]),
    getModuleDescriptor: (id) => okapiResolve({ id }),
    installModulesForTenant: () => okapiResolve([{ id: 'mod-something', action: 'enable' }]),
    pullModuleDescriptorsFromRemote: () => okapiResolve([{ id: 'mod-four' }, { id: 'mod-five' }]),
  }
};

describe('The module-service', function () {
  describe('constructor', function () {
    it('accepts an okapi repository', function () {
      const okapiRepository = {};
      const sut = new ModuleService(okapiRepository);
      expect(sut.okapi).to.equal(okapiRepository);
    });
  });

  describe('addModuleDescriptor method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'addModuleDescriptor');
    });

    it('Returns success for added module', function (done) {
      this.sut.addModuleDescriptor({ id: 'mod-new' })
        .then((result) => {
          expect(okapiStub.proxy.addModuleDescriptor).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-new');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns alreadyExists for existing module', function (done) {
      this.sut.addModuleDescriptor({ id: 'mod-existing' })
        .then((result) => {
          expect(okapiStub.proxy.addModuleDescriptor).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-existing');
          expect(result.success).to.be.undefined;
          expect(result.alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('addModuleDescriptors method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'addModuleDescriptor');
    });

    it('Returns success/doesNotExist for module ids', function (done) {
      this.sut.addModuleDescriptors([{ id: 'mod-new' }, { id: 'mod-existing' }])
        .then((results) => {
          expect(okapiStub.proxy.addModuleDescriptor).to.have.been.calledTwice;

          expect(results).to.be.an('array').with.lengthOf(2);
          expect(results[0].id).to.equal('mod-new');
          expect(results[0].success).to.be.true;

          expect(results[1].id).to.equal('mod-existing');
          expect(results[1].alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('removeModuleDescriptor method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'removeModuleDescriptor');
    });

    it('Returns success for removed module', function (done) {
      this.sut.removeModuleDescriptor({ id: 'mod-existing' })
        .then((result) => {
          expect(okapiStub.proxy.removeModuleDescriptor).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-existing');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns doesNotExist for non-existing module', function (done) {
      this.sut.removeModuleDescriptor({ id: 'mod-not-here' })
        .then((result) => {
          expect(okapiStub.proxy.removeModuleDescriptor).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-not-here');
          expect(result.success).to.be.undefined;
          expect(result.doesNotExist).to.be.true;
          done();
        });
    });
  });

  describe('removeModuleDescriptorIds method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'removeModuleDescriptor');
    });

    it('Returns success/doesNotExist for module ids', function (done) {
      this.sut.removeModuleDescriptorIds(['mod-existing', 'mod-not-here'])
        .then((results) => {
          expect(okapiStub.proxy.removeModuleDescriptor).to.have.been.calledTwice;

          expect(results).to.be.an('array').with.lengthOf(2);
          expect(results[0].id).to.equal('mod-existing');
          expect(results[0].success).to.be.true;

          expect(results[1].id).to.equal('mod-not-here');
          expect(results[1].doesNotExist).to.be.true;
          done();
        });
    });
  });

  describe('enableModuleForTenant method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'enableModuleForTenant');
    });

    it('Returns success for added module', function (done) {
      this.sut.enableModuleForTenant('mod-to-enable', 'diku')
        .then((result) => {
          expect(okapiStub.proxy.enableModuleForTenant).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-to-enable');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns alreadyExists for existing module', function (done) {
      this.sut.enableModuleForTenant('mod-enabled', 'diku')
        .then((result) => {
          expect(okapiStub.proxy.enableModuleForTenant).to.have.been.calledOnce;
          expect(result.id).to.equal('mod-enabled');
          expect(result.alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('enableModulesForTenant method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'enableModuleForTenant');
    });

    it('Returns success for added module', function (done) {
      this.sut.enableModulesForTenant(['mod-to-enable', 'mod-enabled'], 'diku')
        .then((results) => {
          expect(okapiStub.proxy.enableModuleForTenant).to.have.been.calledTwice;
          expect(results).to.be.an('array').with.lengthOf(2);
          expect(results[0].id).to.equal('mod-to-enable');
          expect(results[0].success).to.be.true;

          expect(results[1].id).to.equal('mod-enabled');
          expect(results[1].alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('listModulesForTenant method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'getModulesForTenant');
      this.sandbox.stub(this.sut, 'listModules').resolves(['mod-two']);
    });

    it('Returns modules ids for tenant', function (done) {
      this.sut.listModulesForTenant('diku')
        .then((response) => {
          expect(okapiStub.proxy.getModulesForTenant).to.have.been.calledWith('diku');
          expect(response).to.be.an('array').with.lengthOf(3);
          expect(response).to.include.members(['mod-one', 'mod-two', 'mod-three']);
          done();
        });
    });

    it('Applies module filter', function (done) {
      const filterOptions = { provide: 'something' };
      this.sut.listModulesForTenant('diku', filterOptions)
        .then((response) => {
          expect(okapiStub.proxy.getModulesForTenant).to.have.been.calledWith('diku');
          expect(this.sut.listModules).to.have.been.calledWith(filterOptions);
          expect(response).to.be.an('array').with.lengthOf(1);
          expect(response).to.include.members(['mod-two']);
          done();
        });
    });
  });

  describe('listModules method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'getModules');
      this.sandbox.spy(okapiStub.proxy, 'getModulesThatRequireInterface');
      this.sandbox.spy(okapiStub.proxy, 'getModulesThatProvideInterface');
    });

    it('Returns modules ids', function (done) {
      this.sut.listModules()
        .then((response) => {
          expect(okapiStub.proxy.getModules).to.have.been.calledOnce;
          expect(response).to.be.an('array').with.lengthOf(5);
          expect(response).to.include.members(['mod-one', 'mod-two', 'mod-three', 'mod-four', 'mod-five']);
          done();
        });
    });

    it('Returns modules ids that require an interface', function (done) {
      this.sut.listModules({ require: 'something-to-require' })
        .then((response) => {
          expect(okapiStub.proxy.getModulesThatRequireInterface).to.have.been.calledOnce;
          expect(okapiStub.proxy.getModulesThatRequireInterface).to.have.been.calledWith('something-to-require');
          expect(response).to.be.an('array').with.lengthOf(2);
          expect(response).to.include.members(['mod-one', 'mod-two']);
          done();
        });
    });

    it('Returns modules ids that provide an interface', function (done) {
      this.sut.listModules({ provide: 'something-to-provide' })
        .then((response) => {
          expect(okapiStub.proxy.getModulesThatProvideInterface).to.have.been.calledOnce;
          expect(okapiStub.proxy.getModulesThatProvideInterface).to.have.been.calledWith('something-to-provide');
          expect(response).to.be.an('array').with.lengthOf(2);
          expect(response).to.include.members(['mod-four', 'mod-five']);
          done();
        });
    });
  });

  describe('viewModuleDescriptor method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'getModuleDescriptor');
    });

    it('Returns module descriptor', function (done) {
      this.sut.viewModuleDescriptor('mod-one')
        .then((response) => {
          expect(okapiStub.proxy.getModuleDescriptor).to.have.been.calledOnce;
          expect(response).to.be.an('object').with.property('id').to.equal('mod-one');
          done();
        });
    });
  });

  describe('viewModuleDescriptors method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'getModuleDescriptor');
    });

    it('Returns multiple module descriptors', function (done) {
      this.sut.viewModuleDescriptors(['mod-one', 'mod-two'])
        .then((responses) => {
          expect(okapiStub.proxy.getModuleDescriptor).to.have.been.calledTwice;
          expect(responses).to.be.an('array').with.lengthOf(2);
          expect(responses[0]).to.be.an('object').with.property('id').to.equal('mod-one');
          expect(responses[1]).to.be.an('object').with.property('id').to.equal('mod-two');
          done();
        });
    });
  });

  describe('_generateInstallPayload method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
    });

    describe('given module ids', function () {
      it('Assigns actions', function (done) {
        const input = ['mod-one', 'mod-two'];
        const action = 'disable';
        const expected = [
          { id: 'mod-one', action: 'disable' },
          { id: 'mod-two', action: 'disable' }
        ];

        const output = this.sut._generateInstallPayload(input, action);
        expect(output).to.be.an('array').with.lengthOf(2);
        expect(output).to.deep.equal(expected);
        done();
      });

      it('Assigns default action', function (done) {
        const input = ['mod-one', 'mod-two'];
        const expected = [
          { id: 'mod-one', action: 'enable' },
          { id: 'mod-two', action: 'enable' }
        ];

        const output = this.sut._generateInstallPayload(input);
        expect(output).to.be.an('array').with.lengthOf(2);
        expect(output).to.deep.equal(expected);
        done();
      });
    });

    describe('given module id objects', function () {
      it('Uses the provided actions', function (done) {
        const input = [
          { id: 'mod-one', action: 'enable' },
          { id: 'mod-two', action: 'disable' }
        ];
        const expected = [
          { id: 'mod-one', action: 'enable' },
          { id: 'mod-two', action: 'disable' }
        ];

        const output = this.sut._generateInstallPayload(input);
        expect(output).to.be.an('array').with.lengthOf(2);
        expect(output).to.deep.equal(expected);
        done();
      });

      it('Assigns actions', function (done) {
        const input = [
          { id: 'mod-one' },
          { id: 'mod-two' }
        ];
        const action = 'disable';
        const expected = [
          { id: 'mod-one', action: 'disable' },
          { id: 'mod-two', action: 'disable' }
        ];

        const output = this.sut._generateInstallPayload(input, action);
        expect(output).to.be.an('array').with.lengthOf(2);
        expect(output).to.deep.equal(expected);
        done();
      });

      it('Assigns default action', function (done) {
        const input = [
          { id: 'mod-one' },
          { id: 'mod-two' }
        ];
        const expected = [
          { id: 'mod-one', action: 'enable' },
          { id: 'mod-two', action: 'enable' }
        ];

        const output = this.sut._generateInstallPayload(input);
        expect(output).to.be.an('array').with.lengthOf(2);
        expect(output).to.deep.equal(expected);
        done();
      });
    });
  });

  describe('installModulesForTenant method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'installModulesForTenant');
    });

    it('Passes options for deploy, simulate, and preRelease', function (done) {
      const options = {
        deploy: true,
        simulate: true,
        preRelease: true,
      };
      const expected = {
        deploy: true,
        simulate: true,
        preRelease: true,
      };
      this.sut.installModulesForTenant(['mod-one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Defaults deploy, simulate, and preRelease to false', function (done) {
      const options = {};
      const expected = {
        deploy: false,
        simulate: false,
        preRelease: false,
      };
      this.sut.installModulesForTenant(['mod-one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Returns the JSON response', function (done) {
      this.sut.installModulesForTenant(['mod-one', 'mod-two'], 'diku', {})
        .then((response) => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledOnce;
          expect(response).to.deep.equal([{ id: 'mod-something', action: 'enable' }]);
          done();
        });
    });
  });

  describe('simulateInstallModulesForTenant method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'installModulesForTenant');
    });

    it('Sets deploy=false and simulate=true, defaults preRelease', function (done) {
      const options = {
        deploy: true,
        simulate: false,
      };
      const expected = {
        deploy: false,
        simulate: true,
        preRelease: false,
      };
      this.sut.simulateInstallModulesForTenant(['mod-one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Passes options for preRelease', function (done) {
      const options = {
        preRelease: true,
      };
      const expected = {
        deploy: false,
        simulate: true,
        preRelease: true,
      };
      this.sut.simulateInstallModulesForTenant(['mod-one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Returns the JSON response', function (done) {
      this.sut.simulateInstallModulesForTenant(['mod-one', 'mod-two'], 'diku', {})
        .then((response) => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledOnce;
          expect(response).to.deep.equal([{ id: 'mod-something', action: 'enable' }]);
          done();
        });
    });
  });

  describe('filterFrontendModules method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
    });

    it('Returns front-end module ids', function (done) {
      const input = ['folio_one', 'mod-two'];
      const expected = ['folio_one'];

      const output = this.sut.filterFrontendModules(input);
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });

    it('Returns front-end module object ids', function (done) {
      const input = [
        { id: 'folio_one', action: 'enable' },
        { id: 'mod-two', action: 'enable' }
      ];
      const expected = [
        { id: 'folio_one', action: 'enable' }
      ];

      const output = this.sut.filterFrontendModules(input);
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });
  });

  describe('filterBackendModules method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
    });

    it('Returns back-end module ids', function (done) {
      const input = ['folio_one', 'mod-two'];
      const expected = ['mod-two'];

      const output = this.sut.filterBackendModules(input);
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });

    it('Returns back-end module object ids', function (done) {
      const input = [
        { id: 'folio_one', action: 'enable' },
        { id: 'mod-two', action: 'enable' }
      ];
      const expected = [
        { id: 'mod-two', action: 'enable' }
      ];

      const output = this.sut.filterBackendModules(input);
      expect(output).to.be.an('array').with.lengthOf(1);
      expect(output).to.deep.equal(expected);
      done();
    });
  });

  describe('deployBackendModulesForTenantWithActions method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'installModulesForTenant');
    });

    it('Sets deploy=true, defaults simulate and preRelease', function (done) {
      const options = {
        deploy: false,
      };
      const expected = {
        deploy: true,
        simulate: false,
        preRelease: false,
      };
      this.sut.deployBackendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Passes options for simulate and preRelease', function (done) {
      const options = {
        simulate: true,
        preRelease: true,
      };
      const expected = {
        deploy: true,
        simulate: true,
        preRelease: true,
      };
      this.sut.deployBackendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Passes back-end modules to install', function (done) {
      const input = [
        { id: 'folio_one', action: 'enable' },
        { id: 'mod-two', action: 'enable' }
      ];
      const expected = [
        { id: 'mod-two', action: 'enable' }
      ];

      this.sut.deployBackendModulesForTenantWithActions(input, 'diku', {})
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledWith(expected);
          done();
        });
    });

    it('Returns the JSON response', function (done) {
      this.sut.deployBackendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', {})
        .then((response) => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledOnce;
          expect(response).to.deep.equal([{ id: 'mod-something', action: 'enable' }]);
          done();
        });
    });
  });

  describe('installFrontendModulesForTenantWithActions method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'installModulesForTenant');
    });

    it('Sets deploy=false, defaults simulate and preRelease', function (done) {
      const options = {
        deploy: true,
      };
      const expected = {
        deploy: false,
        simulate: false,
        preRelease: false,
      };
      this.sut.installFrontendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Passes options for simulate and preRelease', function (done) {
      const options = {
        simulate: true,
        preRelease: true,
      };
      const expected = {
        deploy: false,
        simulate: true,
        preRelease: true,
      };
      this.sut.installFrontendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', options)
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).calledWith(sinon.match.any, 'diku', expected);
          done();
        });
    });

    it('Passes front-end modules to install', function (done) {
      const input = [
        { id: 'folio_one', action: 'enable' },
        { id: 'mod-two', action: 'enable' }
      ];
      const expected = [
        { id: 'folio_one', action: 'enable' }
      ];

      this.sut.installFrontendModulesForTenantWithActions(input, 'diku', {})
        .then(() => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledWith(expected);
          done();
        });
    });

    it('Returns the JSON response', function (done) {
      this.sut.installFrontendModulesForTenantWithActions(['folio_one', 'mod-two'], 'diku', {})
        .then((response) => {
          expect(okapiStub.proxy.installModulesForTenant).to.have.been.calledOnce;
          expect(response).to.deep.equal([{ id: 'mod-something', action: 'enable' }]);
          done();
        });
    });
  });

  describe('pullModuleDescriptorsFromRemote method', function () {
    beforeEach(function () {
      this.sut = new ModuleService(okapiStub);
      this.sandbox.spy(okapiStub.proxy, 'pullModuleDescriptorsFromRemote');
    });

    it('Passes the url payload to pull', function (done) {
      const input = 'mockUrl';
      const expected = {
        urls: ['mockUrl']
      };

      this.sut.pullModuleDescriptorsFromRemote(input)
        .then(() => {
          expect(okapiStub.proxy.pullModuleDescriptorsFromRemote).to.have.been.calledWith(expected);
          done();
        });
    });

    it('Returns array of module ids', function (done) {
      this.sut.pullModuleDescriptorsFromRemote('mockUrl')
        .then((response) => {
          expect(response).to.be.an('array').with.lengthOf(2);
          expect(response).to.include.members(['mod-four', 'mod-five']);
          done();
        });
    });
  });
});
