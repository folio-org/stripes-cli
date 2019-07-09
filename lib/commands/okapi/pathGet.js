const importLazy = require('import-lazy')(require);

const EndpointService = importLazy('../../okapi/endpoint-service');
const { okapiOptions, pathRequired, tenantOption } = importLazy('../common-options');


function pathGetCommand(argv) {
  const endpointService = new EndpointService(argv.okapi, argv.tenant);

  const promise = endpointService.get(argv.path);

  return promise
    .then((response) => {
      console.log(response);
    });
}

module.exports = {
  command: 'get <path>',
  describe: 'Perform an HTTP GET request to a given Okapi endpoint',
  builder: (yargs) => {
    yargs
      .positional('path', pathRequired.path)
      .options(Object.assign({}, okapiOptions, tenantOption))
      .example('$0 okapi get /users/123-456', 'Perform a GET request to the "/users/123-456" path');
  },
  handler: pathGetCommand,
};
