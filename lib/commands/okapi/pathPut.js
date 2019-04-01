const importLazy = require('import-lazy')(require);

const { stdinJsonMiddleware } = importLazy('../../cli/stdin-middleware');
const EndpointService = importLazy('../../okapi/endpoint-service');
const { okapiOptions, pathRequired, tenantOption } = importLazy('../common-options');


function pathPutCommand(argv) {
  const endpointService = new EndpointService(argv.okapi, argv.tenant);

  const promise = endpointService.put(argv.path, argv.body);

  return promise
    .then((response) => {
      console.log(response);
    });
}

module.exports = {
  command: 'put <path>',
  describe: 'Perform an HTTP PUT request with JSON payload on stdin sto a given Okapi endpoint',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinJsonMiddleware('body'),
      ])
      .positional('path', pathRequired.path)
      .option('body', {
        describe: 'The JSON to PUT to the endpoint',
        type: 'string',
      })
      .options(Object.assign({}, okapiOptions, tenantOption))
      .example('$0 okapi put /users/123-456', 'Perform a PUT request to the "/users/123-456" path');
  },
  handler: pathPutCommand,
};
