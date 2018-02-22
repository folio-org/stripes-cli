const expect = require('chai').expect;
const match = require('sinon').match;
const path = require('path');
const cliConfig = require('../../lib/cli/config');
const AliasService = require('../../lib/platform/alias-service');
const AliasError = require('../../lib/platform/alias-error');

const storageStub = {
  getAllAliases: () => {},
  addAlias: () => true,
  hasAlias: () => false,
  removeAlias: () => true,
  clearAliases: () => true,
};

describe('The alias-service', function () {
  beforeEach(function () {
    this.aliases = {
      '@folio/users': '../ui-users',
    };
  });

  describe('constructor', function () {
    it('loads aliases from storage', function () {
      this.sandbox.stub(storageStub, 'getAllAliases').returns(this.aliases);
      this.sut = new AliasService(storageStub);
      expect(this.sut.storageAliases).to.deep.equal(this.aliases);
    });

    it('loads aliases from config', function () {
      this.sandbox.stub(cliConfig, 'aliases').value(this.aliases);
      // Simulate that the config file is in the current working directory
      this.sandbox.stub(cliConfig, 'configPath').value(path.join(path.resolve(), '.stripesclirc'));
      this.sut = new AliasService(storageStub);
      expect(this.sut.configAliases).to.deep.equal(this.aliases);
    });

    it('loads alias relative to config file location', function () {
      this.sandbox.stub(cliConfig, 'aliases').value(this.aliases);
      // Simulate that the config file is up a directory
      this.sandbox.stub(cliConfig, 'configPath').value(path.join(path.resolve(), '..', '.stripesclirc'));
      this.sut = new AliasService(storageStub);
      expect(this.sut.configAliases).to.deep.equal({
        '@folio/users': '../../ui-users',
      });
    });
  });

  describe('methods with validation stubs', function () {
    beforeEach(function () {
      this.sandbox.stub(storageStub, 'getAllAliases').returns({ one: 'path/one' });
      this.sandbox.stub(cliConfig, 'aliases').value({ two: 'path/two' });
      this.sut = new AliasService(storageStub);
      this.sandbox.spy(this.sut, 'validateAliases');
      this.sandbox.stub(this.sut, 'validateAlias').callsFake((alias) => {
        const result = { path: `/path/to/${alias}`, type: 'app', isValid: true };
        return result;
      });
    });

    describe('addAlias method', function () {
      it('validates input', function () {
        this.sut.addAlias('@folio/my-app', '../path/to/ui-my-app');
        expect(this.sut.validateAlias).to.have.been.calledOnce;
      });

      it('saves aliases', function () {
        this.sandbox.spy(storageStub, 'addAlias');
        this.sut.addAlias('@folio/my-app', '../path/to/ui-my-app');
        expect(storageStub.addAlias).to.have.been.calledOnce;
      });
    });

    describe('removeAlias method', function () {
      it('returns true when alias was removed', function () {
        this.sandbox.stub(storageStub, 'hasAlias').returns(true);
        const result = this.sut.removeAlias('@folio/my-app');
        expect(result).to.equal(true);
      });

      it('returns false when alias does not exist', function () {
        this.sandbox.stub(storageStub, 'hasAlias').returns(false);
        const result = this.sut.removeAlias('@folio/my-app');
        expect(result).to.equal(false);
      });
    });

    describe('clearAliases method', function () {
      it('clears aliases from storage', function () {
        this.sandbox.stub(storageStub, 'clearAliases').returns(false);
        this.sut.clearAliases();
        expect(storageStub.clearAliases).to.have.been.calledOnce;
      });
    });

    describe('getValidatedAliases method', function () {
      it('merges alias sources', function () {
        const result = this.sut.getValidatedAliases();
        expect(result).to.have.property('one');
        expect(result).to.have.property('two');
      });

      it('validates aliases', function () {
        this.sut.getValidatedAliases();
        expect(this.sut.validateAliases).to.have.been.calledOnce;
      });
    });

    describe('getValidatedConfigAliases method', function () {
      it('validates config aliases', function () {
        const result = this.sut.getValidatedConfigAliases();
        expect(this.sut.validateAliases).to.have.been.calledOnce;
        expect(result).to.not.have.property('one');
        expect(result).to.have.property('two');
      });
    });

    describe('getConfigAliases method', function () {
      it('parses config aliases', function () {
        const result = this.sut.getConfigAliases();
        expect(this.sut.validateAliases).to.have.been.calledOnce;
        expect(this.sut.validateAliases).to.have.been.calledWith(match.any, true);
        expect(result).to.not.have.property('one');
        expect(result).to.have.property('two');
      });
    });

    describe('getStorageAliases method', function () {
      it('parses storage aliases', function () {
        const result = this.sut.getStorageAliases();
        expect(this.sut.validateAliases).to.have.been.calledOnce;
        expect(this.sut.validateAliases).to.have.been.calledWith(match.any, true);
        expect(result).to.have.property('one');
        expect(result).to.not.have.property('two');
      });
    });

    describe('validateAliases method', function () {
      it('calls validateAlias for each alias', function () {
        this.sut.validateAliases({ one: 'path/one', two: 'path/two' });
        expect(this.sut.validateAlias).to.have.been.calledTwice;
      });

      it('propagates parseOnly flag', function () {
        this.sut.validateAliases({ one: 'path/one', two: 'path/two' }, true);
        expect(this.sut.validateAliases).to.have.been.calledWith(match.any, true);
      });
    });
  });

  describe('validateAlias method', function () {
    beforeEach(function () {
      this.sut = new AliasService(storageStub);
      this.sandbox.spy(path, 'join');
      this.sandbox.stub(this.sut.require, 'resolve').returns(true);
      this.sandbox.stub(this.sut, 'require').returns({ name: 'moduleName', stripes: { type: 'app' } });
    });

    it('converts relative paths to absolute', function () {
      const result = this.sut.validateAlias('moduleName', '../modulePath');
      expect(result.path[0]).to.equal('/');
    });

    it('returns alias data', function () {
      const result = this.sut.validateAlias('moduleName', '../modulePath');
      expect(result).to.have.keys('path', 'type', 'isValid', 'hasNodeModules');
    });

    it('assigns stripes type', function () {
      const result = this.sut.validateAlias('moduleName', '../modulePath');
      expect(result).to.have.property('type', 'app');
    });
  });

  describe('validateAlias method error handling', function () {
    beforeEach(function () {
      this.sut = new AliasService(storageStub);
    });

    it('throws AliasError for missing package.json', function () {
      this.sandbox.stub(this.sut.require, 'resolve').throws('oh-no!');
      try {
        this.sut.validateAlias('moduleName', '../modulePath');
      } catch (error) {
        expect(error).to.be.an.instanceof(AliasError);
        expect(error).to.have.property('message').and.match(/No package\.json found/);
      }
    });

    it('throws AliasError module name mismatch', function () {
      this.sandbox.stub(this.sut.require, 'resolve').returns(true);
      this.sandbox.stub(this.sut, 'require').returns({ name: 'moduleName', stripes: { type: 'app' } });
      try {
        this.sut.validateAlias('anotherModuleName', '../modulePath');
      } catch (error) {
        expect(error).to.be.an.instanceof(AliasError);
        expect(error).to.have.property('message').and.match(/was expecting anotherModuleName/);
      }
    });

    it('throws AliasError for missing stripes configuration', function () {
      this.sandbox.stub(this.sut.require, 'resolve').returns(true);
      this.sandbox.stub(this.sut, 'require').returns({ name: 'moduleName' });
      try {
        this.sut.validateAlias('moduleName', '../modulePath');
      } catch (error) {
        expect(error).to.be.an.instanceof(AliasError);
        expect(error).to.have.property('message').and.match(/does not contain a stripes configuration/);
      }
    });

    it('does not throw AliasError when parseOnly is true', function () {
      const result = this.sut.validateAlias('anotherModuleName', '../modulePath', true);
      expect(result.isValid).to.equal(false);
    });
  });
});
