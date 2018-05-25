module.exports = (config) => {
  config.coverageReporter.check.global = {
    statements: 95,
    branches: 85,
    functions: 95,
    lines: 95
  };
};
