import EndpointService from '../../okapi/endpoint-service.js';
import { okapiOptions, pathRequired, tenantOption } from '../common-options.js';


function pathDeleteCommand(argv) {
  const endpointService = new EndpointService(argv.okapi, argv.tenant);

  const promise = endpointService.delete(argv.path);

  return promise
    .then((success) => {
      console.log(`DELETE ${success ? 'succeeded' : 'failed'}.`);
    });
}

export default {
  command: 'delete <path>',
  describe: 'Perform an HTTP DELETE request to a given Okapi endpoint',
  builder: (yargs) => {
    yargs
      .positional('path', pathRequired.path)
      .options(Object.assign({}, okapiOptions, tenantOption))
      .example('$0 okapi delete /users/123-456', 'Perform a DELETE request to the "/users/123-456" path');
  },
  handler: pathDeleteCommand,
};
