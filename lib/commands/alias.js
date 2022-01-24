const importLazy = require('import-lazy')(require);

const AliasService = importLazy('../platform/alias-service');

function listAliases(aliases) {
  const aliasNames = Object.getOwnPropertyNames(aliases);
  if (!aliasNames.length) {
    console.log('  No aliases set.');
  } else {
    for (const name of aliasNames) {
      const alias = aliases[name];
      console.log(`  ${name} --> ${alias.path} [${alias.type || 'other'}] [${alias.isValid ? 'valid' : 'ERROR'}] ${!alias.hasNodeModules ? '[missing node_modules]' : ''}`);
    }
  }
  return aliasNames.length;
}

function aliasCommand(argv) {
  const aliasService = new AliasService();

  switch (argv.sub) {
    case 'add':
      aliasService.addAlias(argv.mod, argv.path);
      console.log(`Alias for ${argv.mod} added to platform.`);
      break;
    case 'remove':
      if (aliasService.removeAlias(argv.mod)) {
        console.log(`Alias for ${argv.mod} removed from platform.`);
      } else {
        console.log(`Platform does not contain module ${argv.mod}`);
      }
      break;
    case 'clear':
      aliasService.clearAliases();
      console.log('All aliases have been removed from platform.');
      break;
    case 'list':
      console.log('Aliases from "alias add" command:');
      listAliases(aliasService.getStorageAliases());
      console.log('\nAliases from CLI config file:');
      listAliases(aliasService.getConfigAliases());
      break;
    default:
      console.log('No sub-command invoked.');
  }
}

module.exports = {
  command: 'alias <sub> [mod] [path]',
  describe: 'Maintain global aliases that apply to all platforms and apps [deprecated: use workspace instead]',
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
      .example('$0 alias add @folio/ui-users ./path/to/ui-users', 'Create alias for ui-users')
      .example('$0 alias remove @folio/ui-users', 'Remove alias for ui-users');
    return yargs;
  },
  handler: aliasCommand,
  listAliases,
};
