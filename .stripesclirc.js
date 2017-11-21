const servePlugin = {
  // Standard yargs builder options object
  options: {
    color: {
      describe: 'Your favorite color',
      type: 'string',
      group: 'My CLI Plugin',
    },
    size: {
      describe: 'What size?',
      type: 'string',
      choices: ['small', 'medium', 'large'],
      group: 'My CLI Plugin',
    },
  },
  // Stripes CLI hook into "webpackOverrides"
  beforeBuild: (config) => {
    console.log('Modify the webpack config!')
    return config;
  }
}

module.exports = {
  // Assign defaults to existing options
  okapi: "http://localhost:9130",
  tenant: "example",
  install: true,

  // Custom command extension
  plugins: {
    serve: servePlugin,
  }
};
