export default (config) => {
  config.coverageIstanbulReporter.thresholds.global = {
    statements: 95,
    branches: 85,
    functions: 95,
    lines: 95
  };
};
