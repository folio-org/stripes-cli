# Stripes CLI Developer's Guide

* [Introduction](#introduction)
* [Development installation](#development-installation)
* [Running tests](#running-tests)
* [Code organization](#code-organization)
* [Commands](#commands)
    * [Options](#options)
    * [Interactive input](#interactive-input)
    * [Standard input](#standard-input)
    * [Grouping](#grouping)
* [Logging](#logging)
* [Okapi Client](#okapi-client)
* [Plugins](#plugins)
* [Documentation](#documentation)
* [Debugging](#debugging)
    * [Visual Studio Code](#visual-studio-code)
    * [Adding breakpoints in Stripes-core](#adding-breakpoints-in-stripes-core)

## Introduction

The Stripes CLI is a command-line interface that runs using Node.  It enhances the default `build` and `serve` operations found within stripes-core's [Node API](https://github.com/folio-org/stripes-core/blob/master/webpack/stripes-node-api.js).  It does this by modifying the Webpack configuration as needed.

Stripes CLI uses the [Yargs](https://github.com/yargs/yargs/) framework for defining commands and [Inquirer](https://www.npmjs.com/package/inquirer) for accepting interactive input.  In addition to providing a convention for defining commands and options, Yargs offers great built-in help.


## Development installation

To develop Stripes CLI, first clone the repo and then `yarn install` its dependencies:

```
git clone https://github.com/folio-org/stripes-cli.git
cd stripes-cli
yarn install
```

Then create a link to `lib/stripes-cli.js` in your path so stripes can easily be run from anywhere.
```
ln -s ./lib/stripes-cli.js /usr/local/bin/stripes
```

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

### Standard input

To accept standard input (stdin) within a command, wrap the command's handler with one of the CLI's stdin handlers from `lib/cli/stdin-handler.js`.  Available stdin handlers include `stdinStringHandler`, `stdinArrayHandler`, and `stdinJsonHandler` for parsing string, array, and JSON input.  The `stdinArrayHandler` splits on whitespace, including line breaks, to make accepting multi-line input easy.

When the invoked, each stdin handler will parse standard input and assign the result to the specified option key.  From within the command, simply access the value as you would any other option.

For example, the following will assign `stdin`, parsed as an array, to the `ids` option:

```javascript
handler: mainHandler(
  stdinArrayHandler('ids', enableModuleCommand)
),
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


## Logging

Logging is instrumented with the [debug](https://www.npmjs.com/package/debug) utility. All logs within the CLI pass through `lib/cli/logger.js`, a wrapper around `debug`, to ensure proper namespace assignment.

To add a logger to code, require and invoke it:
```javascript
const logger = require('./cli/logger')();
logger.log('a message');
```

Optionally, pass the name of a feature or category when invoking the logger.  This is useful for filtering log output.
```javascript
const okapiLogger = require('./cli/logger')('okapi');
okapiLogger.log('a message about Okapi');
```

See [debugging](#debugging) below for details on viewing log output.


## Okapi Client

TODO: Document


## Plugins

The CLI can be extended with plugins.  Plugins provide a means for the user to perform custom logic, possibly altering the Webpack configuration prior to invoking a Webpack build.  They are defined in a `.stripesclirc.js` [configuration file](./user-guide.md#configuration).

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

Stripes-CLI implements [debug](https://www.npmjs.com/package/debug) for diagnostic logging.  This can be a useful starting point to diagnose errors.

Debug output is enabled by setting the `DEBUG` environment variable.  The value of `DEBUG` is a comma-separated list of namespaces you wish to view debug output for.  By convention, namespaces match the supporting package name.  Features within a namespace may be separated by a colon.  The wildcard `*` is supported.

For example, to view all stripes-cli debug logs:
```
DEBUG=stripes-cli* stripes serve
```

To view only the cli's calls to Okapi:
```
DEBUG=stripes-cli:okapi stripes serve
```

To view all stripes-cli and stripes-core debug logs:
```
DEBUG=stripes-cli*,stripes-core* stripes serve
```

Alternatively set the wildcard on stripes:
```
DEBUG=stripes* stripes serve
```

It is also possible set the wildcard for all namespaces:
```
DEBUG=* stripes serve
```
**Note:** The above will enable logging for all packages that happen to be instrumented with `debug`, including `express` and `babel`.

Some of the available diagnostic output can be lengthy.  The `debug` utility writes to stderr, so if you would like to send this content in a file, you can do so with:
```
DEBUG=stripes* stripes serve 2> file.log
```

### Visual Studio Code

Included in the Stripes-CLI repository is a Visual Studio Code `launch.json` configuration which makes debugging a command or Stripes build easy.  This file contains the debug configuration of several sample CLI commands as well as the CLI's own unit tests.

Example configuration:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Serve from PLATFORM",
  "program": "${workspaceFolder}/lib/stripes-cli.js",
  "args": [ "serve", "stripes.config.js"],
  "cwd": "${workspaceFolder}/../stripes-sample-platform"
},
```
Pay careful attention to the current working directory, `cwd`, defined for each configuration as this may not match an app or platform on your current system.  Modify the `cwd` to a suitable (and often temporary) path.  This will be the path in which the CLI is invoked from via VSCode.  It is necessary for determining proper context.

Modify the `args` property to include the command name and any command options desired.  For options, separate out the key from the value.  For example, `--user diku_admin` will have two entries in the array, `--user` and `diku_admin`.

```
  "args": ["perm", "create", "module.hello-world.enabled", "--push", "--user", "diku_admin"],
```

To debug with VSCode, set a breakpoint on the desired command or unit test.  For CLI commands, it is often best to start at the top of the handler, for example, in `lib/commands/serve.js`.  Next, from the debug menu, select the appropriate configuration and click play.

![VSCode breakpoint](img/vscode-breakpoint-serve-command.png)

In situations where the handler is not invoked as expected, check your input in `args`.  Also, try adding `--no-interactive` to ensure the debugger is not improperly handling interactive input.  You can always set the breakpoint in `lib/stripes-cli.js` as the very first point of entry.


### Adding breakpoints in Stripes-core

The version of stripes-core in use by the CLI could vary depending on your CLI install, app, platform, or workspace configuration.  The easiest way to ensure your stripes-core breakpoints will be hit properly is to initiate debugging in the CLI using the `Stripes Serve from PLATFORM` or `Stripes Serve from APP` configuration.  Set your breakpoint at the end of the `serve` command handler where the stripes-core API, `stripes.api.serve(...)`, is invoked.

From there, simply step into the stripes-core code.  VSCode will open the version of stripes-core in use.  Once a stripes-core file is open, inspect its path, then open and set breakpoints on any other desired files found within the stripes-core's `webpack` directory.
