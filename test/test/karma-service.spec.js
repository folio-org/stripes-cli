import { expect } from 'chai';
import path from 'path';
import karma from 'karma';

import KarmaService from '../../lib/test/karma-service.js';

const { config } = { karma };
const webpackStub = {
  resolve: 'somewhere',
};

const parseConfigSub = (configPath, options) => {
  options.set = () => {};
  return options;
};

describe('The karma-service', function () {
  beforeEach(function () {
    this.sut = new KarmaService(path.resolve());
  });

  describe('generateKarmaConfig method', function () {
    beforeEach(function () {
      this.karmaOptions = {};
      this.sandbox.stub(config, 'parseConfig').callsFake(parseConfigSub);
    });

    it('applies webpack config', function () {
      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('webpack').with.property('resolve', 'somewhere');
    });

    it('applies karma options to the config', function () {
      this.karmaOptions.singleRun = true;
      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('singleRun', true);
    });

    it('defaults to mocha reporter', function () {
      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('mocha');
    });

    it('enables the junit reporter', function () {
      this.karmaOptions.reporters = ['junit'];
      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('junit');
      expect(karmaConfig).to.have.property('plugins').to.be.an('array').that.includes('karma-junit-reporter');
    });

    it('enables the coverage reporter', function () {
      this.karmaOptions.coverage = true;
      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('reporters').to.be.an('array').that.includes('coverage-istanbul');
      expect(karmaConfig).to.have.property('plugins').to.be.an('array').that.includes('karma-coverage-istanbul-reporter');
    });

    it('applies a local karma config', function () {
      // Passing import.meta.dirname should prompt the service to consider the karma.conf.js within the current test directory.
      this.sut = new KarmaService(import.meta.dirname);

      // Expected from applying local karma.conf.js
      const globalExpected = {
        statements: 95,
        branches: 85,
        functions: 95,
        lines: 95,
      };

      const karmaConfig = this.sut.generateKarmaConfig(webpackStub, this.karmaOptions);
      expect(karmaConfig).to.have.property('coverageIstanbulReporter').with.property('thresholds').with.deep.property('global', globalExpected);
    });
  });
});
