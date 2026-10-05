import fs from 'fs';
import path from 'path';
import process from 'process';
import stdinMiddlewareMod from '../../cli/stdin-middleware.js';
import EndpointService from '../../okapi/endpoint-service.js';
import commonOptionsMod from '../common-options.js';

const { fileOptions, okapiOptions, pathRequired, tenantOption } = commonOptionsMod;

const { stdinJsonMiddleware } = stdinMiddlewareMod;


function pathPutCommand(argv) {
  const endpointService = new EndpointService(argv.okapi, argv.tenant);

  let body = argv.body;

  if (argv.file) {
    if (fs.existsSync(argv.file)) {
      const file = path.join(process.cwd(), argv.file);
      body = JSON.parse(fs.readFileSync(file, 'utf-8'));
    }
  }

  const promise = endpointService.put(argv.path, body);

  return promise
    .then((response) => {
      console.log(response);
    });
}

export default {
  command: 'put <path> [file]',
  describe: 'Perform an HTTP PUT request with a payload from JSON file/stdin a given Okapi endpoint',
  builder: (yargs) => {
    yargs
      .middleware([
        stdinJsonMiddleware('body'),
      ])
      .positional('path', pathRequired.path)
      .positional('file', fileOptions.json)
      .option('body', {
        describe: 'The JSON to PUT to the endpoint (stdin)',
        type: 'string',
      })
      .options(Object.assign({}, okapiOptions, tenantOption))
      .example('$0 okapi put /users/123-456', 'Perform a PUT request to the "/users/123-456" path');
  },
  handler: pathPutCommand,
};
