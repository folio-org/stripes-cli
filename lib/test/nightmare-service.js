const runProcess = require('../run-process');
const path = require('path');
const { uiModules, platforms } = require('../environment/inventory');
const logger = require('../cli/logger')('nightmare');

const workingDirectoryToken = 'WD'; // instructs ui-testing to run tests against the working directory

module.exports = class NightmareService {
  constructor(cliContext, options) {
    this.cwd = cliContext.cwd;
    this.options = options;
    this.prepareCoverageArgs();
    this.prepareTestArgs(options);
    this.runProcess = runProcess;
  }

  /*
    TODO: Transfer to CLI documents

    ui-testing's test-module CLI accepts "--run" values in the following compound forward-slash and colon separated format:

      --run moduleA/moduleB:testX/moduleC:testY

    * Forward-slashes, "/", separate modules and modules:testScript pairs
    * Modules can be referenced alone, as in "moduleA" above, referring to @folio/moduleA. In this case, the test-module CLI will invoke all the module's test via index named, "@folio/moduleA/test/ui-testing/test.js"
    * When paired with a test script name, as in "moduleB:testX", ui-testing's test-module CLI will invoke just the test script found in "@folio/moduleB/test/ui-testing/testX.js"

    Stripes-CLI introduces a new concept of working directory, allowing for a module or platform to be specified by path rather than @folio-scoped name.
    This enables the CLI to invoke tests from within the current module or platform directory.  The "WD" token instructs test-module to apply the working directory, rather than @folio scope.

      --run WD/WD:testZ/moduleA/moduleB:testX/moduleC:testY

    Stripes-CLI defaults to the working directory context, applying "WD" token to each segment automatically.
    The token will not be applied when already present, a colon is present, or the segment matches a ui-module name.
    To observe the generated "--run" value passed to ui-testing, enable DEBUG=stripes-cli:nightmare
  */
  _getRunValue(options) {
    const applyWorkingDirectoryToken = (runSegment) => {
      if (runSegment.includes(':') || runSegment.startsWith(workingDirectoryToken) || uiModules.includes(`ui-${runSegment}`) || platforms.includes(runSegment)) {
        return runSegment;
      }
      return `${workingDirectoryToken}:${runSegment}`;
    };

    if (options.uiTest && options.uiTest.run) {
      return options.uiTest.run; // Pass a raw --run value to ui-testing
    } else if (options.run) {
      return options.run.split('/').map(applyWorkingDirectoryToken).join('/'); // Parse --run and apply token as needed
    } else {
      return workingDirectoryToken; // No --run specified, apply token
    }
  }
  prepareCoverageArgs() {
    // send report command first to produce coverage
    this.nycArgs = ['report',
      '--reporter=lcov', // choose file output to be lcov
      '--reporter=text', // choose console output as well
      '--temp-directory', // point the process at the coverage file location
      './artifacts/coveragetemp',
      '--clean']; // use clean to delete past coverage runs
  }
  prepareTestArgs(options) {
    const serveUrl = `http://${options.host || 'localhost'}:${options.port || '3000'}`;

    this.testArgs = [];

    // continue rest of test arg set up as normal

    this.testArgs = [
      '--workingDirectory', this.cwd,
      '--url', options.url || serveUrl,
      '--run', this._getRunValue(options),
    ];

    if (options.show) {
      this.testArgs.push('--show');
      this.testArgs.push('--devTools');
    }
    if (options.coverage) {
      this.testArgs.push('--coverage');
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
    const uiTestModule = require.resolve('@folio/stripes-testing/test-module.js');
    logger.log('test-module path', uiTestModule);
    return this.runProcess(mocha, [uiTestModule].concat(this.testArgs));
  }
  runCoverageReport() {
    const nyc = path.join(__dirname, '../../node_modules/.bin/nyc');
    // execute nyc
    return this.runProcess(nyc, this.nycArgs);
  }
};
