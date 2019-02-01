const expect = require('chai').expect;
const fs = require('fs');

const DiscoveryService = require('../../lib/okapi/discovery-service');
const OkapiError = require('../../lib/okapi/okapi-error');

const okapiResolve = (data) => Promise.resolve({ json: () => data });
const okapiReject = (message) => Promise.reject(new OkapiError({}, message));

const contextStub = {
  isBackendModule: true,
  cwd: 'path/to/mod-backend'
};

const okapiStub = {
  discovery: {
    getInstances: (id) => {
      if (id === 'mod-not-here') {
        return okapiReject(id);
      }
      return okapiResolve([{
        instId: 'instance-one',
        srvcId: id,
        url: 'http://localhost:8081'
      }, {
        instId: 'instance-two',
        srvcId: id,
        url: 'http://localhost:8082'
      }]);
    },
    addInstance: (descriptor) => {
      return okapiResolve({
        instId: descriptor.instId,
        srvcId: descriptor.srvcId,
        url: descriptor.url
      });
    },
    removeInstances: (id) => {
      if (id === 'mod-not-here') {
        return okapiReject(id);
      }
      return okapiResolve({});
    },
  }
};

const deploymentDescriptorStub = {
  srvcId: 'mod-backend-1.2.3',
  nodeId: 'localhost',
  descriptor: {
    exec: 'java -Dport=%p -jar ../mod-backend/target/mod-backend.jar'
  }
};

const notHereDescriptorStub = {
  srvcId: 'mod-not-here',
};

describe('The discovery-service', function () {
  describe('constructor', function () {
    it('accepts an okapi repository and context', function () {
      const sut = new DiscoveryService(okapiStub, contextStub);
      expect(sut.okapi).to.equal(okapiStub);
      expect(sut.context).to.equal(contextStub);
    });
  });

  describe('getDeploymentDescriptor method', function () {
    beforeEach(function () {
      this.sut = new DiscoveryService(okapiStub, contextStub);
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(deploymentDescriptorStub));
    });

    it('Loads deployment descriptor for a backend module', function (done) {
      this.sandbox.stub(fs, 'existsSync').returns(true);
      const output = this.sut.getDeploymentDescriptor();
      expect(output).to.deep.equal(deploymentDescriptorStub);
      done();
    });

    it('Reports when deployment descriptor is missing', function (done) {
      this.sandbox.stub(fs, 'existsSync').returns(false);
      try {
        this.sut.getDeploymentDescriptor();
        expect(true).to.equal(false);  // This test should throw, so we should not get here
      } catch (error) {
        expect(error.message).to.contain('Unable to locate');
        done();
      }
    });
  });


  describe('listInstancesForContext method', function () {
    beforeEach(function () {
      this.sut = new DiscoveryService(okapiStub, contextStub);
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.spy(okapiStub.discovery, 'getInstances');
    });

    it('Returns list of instances', function (done) {
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(deploymentDescriptorStub));
      this.sut.listInstancesForContext()
        .then((result) => {
          expect(okapiStub.discovery.getInstances).to.have.been.calledOnce;
          expect(result).to.be.an('object').with.property('instances');
          expect(result.instances).to.be.an('array').with.lengthOf(2);
          expect(result.instances[0].instId).to.equal('instance-one');
          done();
        });
    });

    it('Returns an empty array when no instances are found', function (done) {
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(notHereDescriptorStub));
      this.sut.listInstancesForContext()
        .then((result) => {
          expect(okapiStub.discovery.getInstances).to.have.been.calledOnce;
          expect(result).to.be.an('object').with.property('instances');
          expect(result.instances).to.be.an('array').with.lengthOf(0);
          done();
        });
    });
  });

  describe('addLocalInstanceForContextOnVagrantVM method', function () {
    beforeEach(function () {
      this.sut = new DiscoveryService(okapiStub, contextStub);
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(deploymentDescriptorStub));
      this.sandbox.spy(okapiStub.discovery, 'addInstance');
    });

    it('Assigns port to "10.0.2.2" and instance id', function (done) {
      this.sut.addLocalInstanceForContextOnVagrantVM(8080)
        .then(() => {
          expect(okapiStub.discovery.addInstance).to.have.been.calledOnce;
          const call = okapiStub.discovery.addInstance.getCall(0);
          expect(call.args[0]).to.be.an('object').to.have.keys('instId', 'url', 'srvcId');
          expect(call.args[0].instId).to.be.a('string');
          expect(call.args[0].url).to.equal('http://10.0.2.2:8080');
          done();
        });
    });

    it('Omits nodeId and descriptor', function (done) {
      this.sut.addLocalInstanceForContextOnVagrantVM(8080)
        .then(() => {
          expect(okapiStub.discovery.addInstance).to.have.been.calledOnce;
          const call = okapiStub.discovery.addInstance.getCall(0);
          expect(call.args[0]).to.be.an('object').not.to.have.keys('nodeId', 'descriptor');
          done();
        });
    });
  });

  describe('addInstanceForContext method', function () {
    beforeEach(function () {
      this.sut = new DiscoveryService(okapiStub, contextStub);
      this.sandbox.stub(fs, 'existsSync').returns(true);
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(deploymentDescriptorStub));
      this.sandbox.spy(okapiStub.discovery, 'addInstance');
    });

    it('Assigns URL and instance id', function (done) {
      this.sut.addInstanceForContext('http://localhost:8080')
        .then(() => {
          expect(okapiStub.discovery.addInstance).to.have.been.calledOnce;
          const call = okapiStub.discovery.addInstance.getCall(0);
          expect(call.args[0]).to.be.an('object').to.have.keys('instId', 'url', 'srvcId');
          expect(call.args[0].instId).to.be.a('string');
          expect(call.args[0].url).to.equal('http://localhost:8080');
          done();
        });
    });

    it('Omits nodeId and descriptor', function (done) {
      this.sut.addInstanceForContext('http://localhost:8080')
        .then(() => {
          expect(okapiStub.discovery.addInstance).to.have.been.calledOnce;
          const call = okapiStub.discovery.addInstance.getCall(0);
          expect(call.args[0]).to.be.an('object').not.to.have.keys('nodeId', 'descriptor');
          done();
        });
    });
  });

  describe('removeInstancesForContext method', function () {
    beforeEach(function () {
      this.sut = new DiscoveryService(okapiStub, contextStub);
      this.sandbox.stub(fs, 'existsSync').returns(true);

      this.sandbox.spy(okapiStub.discovery, 'removeInstances');
    });

    it('Removes instances', function (done) {
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(deploymentDescriptorStub));
      this.sut.removeInstancesForContext()
        .then((result) => {
          expect(okapiStub.discovery.removeInstances).to.have.been.calledOnce;
          expect(result).to.be.an('object').with.property('success').that.equals(true);
          done();
        });
    });

    it('Reports when there is nothing to remove', function (done) {
      this.sandbox.stub(fs, 'readFileSync').returns(JSON.stringify(notHereDescriptorStub));
      this.sut.removeInstancesForContext()
        .then((result) => {
          expect(okapiStub.discovery.removeInstances).to.have.been.calledOnce;
          expect(result).to.be.an('object').that.does.not.have.property('success');
          done();
        });
    });
  });
});
