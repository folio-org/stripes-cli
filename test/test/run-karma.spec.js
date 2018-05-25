const expect = require('chai').expect;
const path = require('path');
const { Server, config } = require('karma');
const { generateKarmaConfig, runKarmaTests } = require('../../lib/test/run-karma');

const webpackStub = {
  entry: 'somewhere',
};

const parseConfigSub = (configPath, options) => options;

describe('The run-karma module', function () {
  describe('generateKarmaConfig method', function () {
    beforeEach(function () {
      this.karmaOptions = {};
      this.sandbox.stub(config, 'parseConfig').callsFake(parseConfigSub);
    });

    it('applies webpack config', function () {
      const karmaConfig = generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('webpack').with.property('entry', 'somewhere');
    });

    it('applies karma options to the config', function () {
      this.karmaOptions.singleRun = true;
      const karmaConfig = generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('singleRun', true);
    });

    it('defaults to mocha reporter', function () {
      const karmaConfig = generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('mocha');
    });

    it('enables the junit reporter', function () {
      this.karmaOptions.reporters = ['junit'];
      const karmaConfig = generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('junit');
      expect(karmaConfig).to.have.property('plugins').to.be.an('array').that.includes('karma-junit-reporter');
    });

    it('enables the coverage reporter', function () {
      this.karmaOptions.coverage = true;
      const karmaConfig = generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('coverage');
      expect(karmaConfig).to.have.property('plugins').to.be.an('array').that.includes('karma-coverage');
    });
  });
});
