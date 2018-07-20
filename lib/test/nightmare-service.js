const runProcess = require('../run-process');
const path = require('path');
const logger = require('../cli/logger')('nightmare');


module.exports = class NightmareService {
  constructor(cliContext, options) {
    this.cwd = cliContext.cwd;
    this.options = options;
    this.prepareTestArgs(options);
    this.runProcess = runProcess;
  }

  prepareTestArgs(options) {
    const serveUrl = `http://${options.host || 'localhost'}:${options.port || '3000'}`;
    // send report command first to produce coverage
    this.nycArgs = [];
    this.nycArgs.push(`report`);
    // print to console and to lcov format
    this.nycArgs.push('--reporter=lcov');
    this.nycArgs.push('--reporter=text');
    // use clean to delete past coverage runs
    this.nycArgs.push('--clean');
    this.testArgs = [];
    const uiTestModule = require.resolve('@folio/ui-testing/test-module.js');
    this.testArgs.push(uiTestModule);
    logger.log('test-module path', uiTestModule);
    // continue rest of test as normal
    this.testArgs.push('--workingDirectory');
    this.testArgs.push(this.cwd);
    this.testArgs.push('--url');
    this.testArgs.push(options.url || serveUrl);
    this.testArgs.push('--run');
    this.testArgs.push( options.run ? `WD:${options.run}` : 'WD'); // Here 'WD' instructs ui-testing to run tests against the working directory
    

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

    return this.runProcess(mocha, this.testArgs);
  
    
  }
  runCoverageReport() {
      const nyc = path.join(__dirname, '../../node_modules/.bin/nyc');
      // execute nyc 
      return this.runProcess(nyc, this.nycArgs)
      .then(() =>{
        logger.log("ran coverage");
        process.exit(0);
      })
      .catch(() => {
        logger.log("error in coverage");
        process.exit(1);
      });
    
  }
};
