const StripesPlatform = require('../stripes-platform');

function listAliases(aliases) {
  const moduleNames = Object.getOwnPropertyNames(aliases);
  if (!moduleNames.length) {
    console.log('No aliases set.');
  } else {
    console.log('Platform aliases:');
    for (const moduleName of moduleNames) {
      console.log(`    ${moduleName} --> ${aliases[moduleName]}`);
    }
  }
}

function aliasCommand(argv) {
  const platform = new StripesPlatform();

  switch (argv.sub) {
    case 'add':
      platform.addAlias(argv.mod, argv.path)
        .then(() => {
          console.log(`Alias for ${argv.mod} added to platform.`);
        })
        .catch((error) => {
          console.log('Unable to add alias:', error);
        });
      break;
    case 'remove':
      platform.removeAlias(argv.mod)
        .then(() => {
          console.log(`Alias for ${argv.mod} added to platform.`);
        })
        .catch((error) => {
          console.log('Unable to remove alias:', error);
        });
      break;
    case 'clear':
      platform.clearAliases()
        .then(() => {
          console.log('All aliases have been removed from platform.');
        });
      break;
    case 'list':
      platform.getAllAliases().then(listAliases);
      break;
    default:
      console.log('No sub-command invoked.');
  }
}

module.exports = {
  command: 'alias <sub> [mod] [path]',
  describe: 'Maintain aliases for virtual platform.',
  builder: (yargs) => {
    yargs.positional('sub', {
      describe: 'Alias operation',
      type: 'string',
      choices: ['add', 'list', 'remove', 'clear'],
    });
    yargs.positional('mod', {
      describe: 'UI module to alias',
      type: 'string',
    });
    yargs.positional('path', {
      describe: 'Relative path to UI module',
      type: 'string',
    });
    yargs.option('platform', {
      describe: 'A platform to associate this alias to.',
      type: 'string',
      hidden: true, // Not yet implemented.
    });
    yargs
      .example('$0 alias add @folio/ui-users ./path/to/ui-users')
      .example('$0 alias remove @folio/ui-users');
    return yargs;
  },
  handler: aliasCommand,
};
