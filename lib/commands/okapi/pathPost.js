const importLazy = require('import-lazy')(require);

const { stdinJsonMiddleware } = importLazy('../../cli/stdin-middleware');
const EndpointService = importLazy('../../okapi/endpoint-service');
const { okapiOptions, pathRequired, tenantOption } = importLazy('../common-options');


function pathPostCommand(argv) {
  const endpointService = new EndpointService(argv.okapi, argv.tenant);

  const promise = endpointService.post(argv.path, argv.body);

  return promise
    .then((response) => {
      console.log(response);
    });
}

module.exports = {
  command: 'post <path>',
  describe: 'Perform an HTTP POST request with JSON payload on stdin to a given Okapi endpoint',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinJsonMiddleware('body'),
      ])
      .positional('path', pathRequired.path)
      .option('body', {
        describe: 'The JSON to POST to the endpoint',
        type: 'string',
      })
      .options(Object.assign({}, okapiOptions, tenantOption))
      .example('$0 okapi post /users', 'Perform a POST request to the "/users" path');
  },
  handler: pathPostCommand,
};
