# Stripes CLI Developer's Guide

* [Introduction](#introduction)
* [Development installation](#development-installation)
* [Running tests](#running-tests)
* [Code organization](#code-organization)
* [Commands](#commands)
    * [Options](#options)
    * [Interactive input](#interactive-input)
    * [Grouping](#grouping)
* [Okapi Client](#okapi-client)
* [Plugins](#plugins)
* [Documentation](#documentation)
* [Debugging](#debugging)

## Introduction

The Stripes CLI is a command line interface that runs using Node.  It enhances the default `build` and `serve` operations found within stripes-core's [Node API](https://github.com/folio-org/stripes-core/blob/master/webpack/stripes-node-api.js).  It does this by modifying the Webpack configuration as needed.

Stripes CLI uses the [Yargs](https://github.com/yargs/yargs/) framework for defining commands and [Inquirer](https://www.npmjs.com/package/inquirer) for accepting interactive input.  In addition to providing a convention for defining commands and options, Yargs offers great built-in help.


## Development Installation

To develop Stripes CLI, first clone the repo.  Although not required, it helps to install the Stripes globally with NPM.  This will put "stripes" in your path so it can easily be run from anywhere.

```
git clone https://github.com/folio-org/stripes-cli.git
cd stripes-cli
npm install -g
```

Note: NPM is used here as it appears Yarn does not have an equivalent for globally installing a local module.  Really all we need out of this operation is the global symlink.  The symlink could be created manually and the dependencies installed with Yarn.


## Running tests

The CLI's tests use Mocha, Chai, and Sinon.  Run the test with the `test` script:

```
yarn test
```

## Code organization

The main CLI directories:

```
stripes-cli
├─doc          Documentation
├─resources    Template files
├─test         CLI tests
└─lib
  ├─cli        CLI context and common logic
  ├─commands   Command handlers
  ├─okapi      Okapi services and http client
  └─platform   Platform generation logic
```

## Commands

All commands are organized in the `lib/commands` directory.  A command consists of [Yargs command module](https://github.com/yargs/yargs/blob/master/docs/advanced.md#providing-a-command-module) that exports:

* `command` - String of the command name and any positional arguments
* `describe` - Description of the command
* `builder` - Function accepting and returning a Yargs instance for defining options, examples, and other things
* `handler` - Function invoked with a parsed `argv` to perform the command

In addition, the handler should be wrapped in the CLI's own `mainHandler()` to provide proper context.

Example command:
```javascript
// Lazy load to improve startup time
const importLazy = require('import-lazy')(require);
const { mainHandler } = importLazy('../cli/main-handler');

// The command itself
function myCommand(argv, context) {
  console.log(`Hello ${argv.name}!`);
}

// Yargs command module with a builder function
module.exports = {
  command: 'hello',
  describe: 'A very basic command',
  builder: (yargs) => {
    yargs
      .option('name', {
        describe: 'A name to say hello to',
        type: 'string',
      })
      .example('$0 hello --name folio', 'Say hello to "folio".');
  },
  // Wrap the command with mainHandler to receive CLI context
  handler: mainHandler(myCommand),
};
```

Complex logic, or logic consumed by more than one command should be kept in separate modules.  Although not a strict requirement, try to limit user input and output to the command handler itself.  This best allows the work to be shared in different contexts where the messaging may differ across commands or use-cases.


### Options

Options are defined using Yargs option syntax.

Example:
```
port: {
  type: 'number',
  describe: 'Development server port',
  default: 3000,
  group: 'Server Options:',
},
```

Useful settings include:
* `type` - option type (string, boolean, number, array)
* `describe` - description for help
* `default` - value when the option is not provided
* `group` - grouping in the help output
* `choices` - limit validation to predefined values
* `conflicts` - options that must not be set with this one

At minimum, include `type` and `describe` properties for all options help populate the help.  See the Yargs [.options API documentation](https://github.com/yargs/yargs/blob/master/docs/api.md#optionkey-opt) for all available settings.

Options used in more than one command should be kept in `lib/commands/common-options`.  Organize and export them in logical groupings, then import the desired options in each command.  Doing so consolidates the option metadata, so option descriptions and types remain consistent across the application.  Use the CLI's `applyOptions()` helper function (found in `common-options`) to facilitate adding imported options to the yargs builder.

```javascript
builder: (yargs) => {
  return applyOptions(yargs, okapiOptions, serverOptions);
},
```

### Interactive input

When answers to questions can be acquired up front, the simplest way to ask for them is to wrap your command handler with the CLI's `promptHandler` from `lib/questions`.  This `promptHanlder` will be invoked like a middleware, checking the incoming `argv` for possible answers.  The user will be prompted for any questions that have no answers before the command is invoked.

This example will prompt for a password before invoking the command:

```javascript
handler: mainHandler(promptHandler({
  password: authOptions.password,
}, loginCommand)),
```

Yargs options and Inquirer questions do not have fully compatible structures.  When a CLI option is also used as an interactive question, avoid duplication by using the CLI's `yargsToInquirer()` helper.  This is automatically invoked by `promptHandler`.

Any Inquirer question settings that do not have a Yargs option equivalent can be defined in an `inquirer` property.  In the following example, Yargs has no equivalent for the `password` type or `mask` setting.  The `yargsToInquirer()` helper will apply any inquirer-specific options after conversion.

```javascript
password: {
  type: 'string',
  describe: 'Okapi tenant password',
  group: 'Okapi Options:',
  inquirer: {
    type: 'password',
    mask: '*',
  },
},
```

### Grouping

Related commands can be grouped together using directories.  To do this create a directory to contain the related commands and create a command to reference the directory.

Here we have `mod.js` the command, and `mod` the directory:

```
stripes-cli
└─lib
  └─commands
    ├─mod.js
    └─mod
      ├─add.js
      ├─remove.js
      ├─update.js
      ├─enable.js
      └─disable.js

```

Using Yarg's `.commandDir()`, the command instructs Yargs to retrieve all commands found in the `mod` directory.  No handler is necessary if `mod` does nothing on its own.

```javascript
module.exports = {
  command: 'mod <command>',
  describe: 'Commands to manage UI module descriptors',
  builder: yargs => yargs.commandDir('mod'),
  handler: () => {},
};
```

The resulting commands from above are all accessible by `mod` followed by the command name.  This gives the appearance of sub-commands under `mod`.  For example:

```
stripes mod add
stripes mod remove
```

Yargs will surface descriptions for each command in the `mod` directory with the help output for `stripes mod --help`.

## Okapi Client

TODO: Document


## Plugins

The CLI can be extended with plugins.  Plugins provide a means for the user to perform custom logic, possibly altering the Webpack configuration prior to invoking a Webpack build.  They are defined in a `.stripesclirc.js` [configuration file](./user-guide.md#Configuration).

To create a plugin, define a `plugins` object in `.stripesclirc.js` which contains keys representing each command that is receiving a plugin.  In this example, a plugin has been defined for `serve`:

```javascript
module.exports = {
  port: 8080,
  plugins: {
    serve: servePlugin,
  },
};
```

The value should be an object containing `beforeBuild` and, optionally, `options`.
* `beforeBuild` is a function that will be passed the command's parsed `argv`.  It should return a function that will be passed Webpack config processed by the CLI.  This gives the opportunity for the plugin to inspect or modify the config prior to running Webpack.
* `options` define additional Yargs options for the command.  When provided, options will be validated and included in the command help along the CLI's built-in options.

```javascript
const servePlugin = {
  options: {
    example: {
      describe: 'This will show up in the help',
      type: 'string',
    },
  },
  beforeBuild: (argv) => {
    return (config) => {
      // Chance to inspect or modify the config based on argv...
      return config;
    };
  },
}
```



## Documentation

The best way to document the CLI is within each Yargs command module.  Be sure to include a description for the command, options, and positionals.  Include `type` for options and positionals.

Group options where it make sense using the `group` property.  This breaks out options in the help for readability.

```javascript
module.exports.serverOptions = {
  port: {
    type: 'number',
    describe: 'Development server port',
    default: 3000,
    group: 'Server Options:',
  },
  // ...
}
```

Add one or more examples on how to use the command by calling `.example()` in the Yargs builder.  `$0` within the example string is replaced by the script name (stripes) in the help output:
```javascript
builder: (yargs) => {
  yargs
    .example('$0 hello', 'Say hello')
    .example('$0 hello --name folio', 'Say hello to "folio".');
  // ...
},
```

After creating a new command or updating an existing one, be sure to update `docs/commands.md`.  A utility script has been created to help with this.  Pipe the command's help output to `doc/generator` to create markdown out of the Yargs command help:

```
stripes build --help | node doc/generator
```

Note: This script helps to quickly create markdown tables out of the command options and code blocks for the examples, but it is far from perfect.  Review the generated markdown with the actual help output to correct formatting errors and check for possible omissions.

Finally update table of contents in `doc/commands.md` as needed. The TOC can be regenerated using Okapi's [`md2toc` script](https://github.com/folio-org/okapi/blob/master/doc/md2toc).

```
perl md2toc -l 2 doc/commands.md
```

## Debugging

TODO: Document

