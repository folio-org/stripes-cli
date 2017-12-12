const importLazy = require('import-lazy')(require);

const PlatformStorage = importLazy('../platform/platform-storage');
const { validateAlias, AliasError } = importLazy('../platform/alias-validation');
const cliConfig = require('../cli-config');

function listAliases(aliases) {
  const aliasNames = Object.getOwnPropertyNames(aliases);
  if (!aliasNames.length) {
    console.log('No aliases set.');
  } else {
    for (const name of aliasNames) {
      let isValid;
      try {
        // Check that alias is still valid
        validateAlias(name, aliases[name]);
        isValid = true;
      } catch (err) {
        if (err instanceof AliasError) {
          isValid = false;
        }
      }
      console.log(`  ${name} --> ${aliases[name]} [${isValid ? 'valid' : 'ERROR'}]`);
    }
  }
}

function aliasCommand(argv) {
  const platform = new PlatformStorage();

  switch (argv.sub) {
    case 'add':
      platform.addAlias(argv.mod, argv.path);
      console.log(`Alias for ${argv.mod} added to platform.`);
      break;
    case 'remove':
      if (platform.hasAlias(argv.mod)) {
        platform.removeAlias(argv.mod);
        console.log(`Alias for ${argv.mod} removed from platform.`);
      } else {
        console.log(`Platform does not contain module ${argv.mod}`);
      }
      break;
    case 'clear':
      platform.clearAliases();
      console.log('All aliases have been removed from platform.');
      break;
    case 'list':
      console.log('Aliases:');
      listAliases(platform.getAllAliases());
      if (cliConfig.aliases) {
        console.log(`\nAliases from ${cliConfig.configPath}:`);
        listAliases(cliConfig.aliases);
      }
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
  listAliases,
};
