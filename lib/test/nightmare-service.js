const runProcess = require('../run-process');
const path = require('path');
const logger = require('../cli/logger')('nightmare');


module.exports = class NightmareService {
  constructor(cliContext, options) {
    this.cwd = cliContext.cwd;
    this.prepareTestArgs(options);
    this.runProcess = runProcess;
  }

  prepareTestArgs(options) {
    const serveUrl = `http://${options.host || 'localhost'}:${options.port || '3000'}`;
    //send report command first to produce coverage
    if(options.coverage) {
      this.testArgs.push(`report`);
    }
    //determine if the reporter is lcov style or printed to console
    if(options.coverage && !options.report) {
      this.testArgs.push(`--reporter=lcov`);
    }
    //use clean to delete past coverage runs
    //then add mocha command to run
    if(options.coverage) {
      this.testArgs.push(`--clean`);
      this.testArgs.push(path.join(__dirname, '../../node_modules/.bin/mocha'))
    }
    //continue rest of test as normal
    this.testArgs = [
      '--workingDirectory', this.cwd,
      '--url', options.url || serveUrl,
      '--run', options.run ? `WD:${options.run}` : 'WD', // Here 'WD' instructs ui-testing to run tests against the working directory
    ];

    if (options.show) {
      this.testArgs.push('--show');
      this.testArgs.push('--devTools');
    }

    // Apply args for ui-testing
    if (options.uiTest && typeof options.uiTest === 'object') {
      Object.keys(options.uiTest).forEach((key) => {
        this.testArgs.push(`--${key}`);
        if (options.uiTest[key]) {
          this.testArgs.push(options.uiTest[key]);
        }
      });
    }
    logger.log('test-module args', this.testArgs);
  }

  runNightmareTests() {
    const mocha = path.join(__dirname, '../../node_modules/.bin/mocha');
    const nyc = path.join(__dirname, '../../node_modules/.bin/nyc')
    const uiTestModule = require.resolve('@folio/ui-testing/test-module.js');
    logger.log('test-module path', uiTestModule);
    const mochaArgs = [uiTestModule].concat(this.testArgs);
    if(this.testArgs.coverage) {
        //execute nyc 
        return this.runProcess(nyc, nycargs);

    } else {
      return this.runProcess(mocha, mochaArgs);
    }
    
  }
};
