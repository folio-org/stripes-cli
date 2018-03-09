# Stripes CLI User Guide

Note: When serving or building an existing app module that has dependencies on unreleased versions of other Stripes modules, be sure to use the `npm-folioci` registry.  This applies whether you've installed the CLI from `npm-folio` or `npm-folioci`.

## Using the CLI

Stripes CLI is invoked with the `stripes` command.  When Stripes CLI is [installed](../README.md#installation) globally, Yarn will make the `stripes` command available in your path.  To run a given command, run `stripes` followed by the desired command name.

Example:
```
stripes serve
```

### Options

Any option can be passed to the CLI either on the command line, as an [environment variable](#environment-variables), or in a `.stripesclirc` [configuration file](#configuration).

Options passed on the command line are prefixed with `--` in the form of `--optionName value`.

```
stripes serve --port 8080
```

Notes:
* Boolean options are considered true by simply passing the option name.  No value is required.
* To explicitly set a Boolean option to false, prefix the option name with `--no-` as in `--no-optionName`.
* String options can be wrapped in quotes when spaces are desired. This is helpful for descriptions.
* Array option values are space-separated.

Example passing array values for `modules` and false for `workspace`:
```
stripes platform create --modules ui-users stripes-core stripes-components --no-workspace
```


### Help
Every command in Stripes CLI includes a description, list of options with descriptions, and often example usages.  To view help for any command, simply pass the `--help` option to the command.

```
stripes serve --help
```

### Sub-commands
Related CLI commands are often grouped together.  This for organizational purposes.

Example "sub-commands" of the `platform` command:
```
stripes platform create
stripes platform pull
```

### Interactive commands
Some commands may require additional input before continuing.  When necessary, a command may prompt the user with questions.  This interactive input can be disabled entirely by passing `--no-interactive`.  This is useful when the CLI is part of an automated script.

```
stripes app create "Hello World" --no-interactive
```

Note: This will force default values, if available, to be used.  When no suitable defaults are available, the command may fail or produce unexpected results.  Please verify behavior first.


## Configuration
Frequently used options can be saved to a `.stripesclirc` configuration file to avoid entering them each time.  Stripes CLI will use the configuration file found in the current working directory, or the first one found walking up the tree.  The default configuration file format is JSON.

Any supported command line positional or option can be defined.  For example:
```
{
  "configFile": "stripes.config.js",
  "port": 8080
}
```

In addition to command line options, aliases for Stripes UI modules are also supported.  Aliases paths should be relative to the directory containing the `.stripesclirc` config file which defines the aliases.
```
{
  "aliases": {
    "@folio/users": "../ui-users"
  }
}
```

### Module export
In addition to JSON, the CLI configuration may be authored as a JavaScript module export.  This is useful for generating options dynamically or defining [CLI plugins](./dev-guide.md#plugins). When defining a JavaScript module export, be sure to use the `.js` file extension.

Example `.stripesclirc.js`:
```
const environment = process.env.NODE_ENV;
let url;

if (environment === 'sandbox') {
  url = 'https://okapi-sandbox.frontside.io';
} else {
  url = 'https://okapi.frontside.io';
}

module.exports = {
  okapi: url,
  tenant: 'fs',
  install: true,
}
```

### Environment variables
Any CLI option can be set using environment variables prefixed with `STRIPES_`.  For example, to specify the `--port` option, use an environment variable named `STRIPES_PORT=8080`.


## Background

### CLI Context

CLI operations may vary depending on the context in which the command is run.  By identifying a context, the CLI can validate the command is appropriate and, in some cases, modify workflow as needed.  Context is determined by the `package.json` in the working directory.  Use the `status` command to view the current context.

Types:
* `APP` - Identified by the value of the `stripes.type` property in `package.json`.  The CLI will automatically generate a virtual platform when serving an UI app module in isolation.
* `PLATFORM` - Identified by a package.json containing one or more `@folio/` dependencies, but no `stripes` object. 
* `WORKSPACE` - CLI is run from a directory containing a Yarn workspace package.json.
* `EMPTY` - No `package.json` detected.  Suitable for creating new UI apps or platforms.
* `CLI` - Command is run from the Stripes CLI directory.
 

### Platforms

Stripes UI modules are meant to be built together with other modules in a platform that shares common build infrastructure.  A platform consists of a `package.json` and a tenant configuration typically named `stripes.config.js`. See the [Stripes Sample Platform](https://github.com/folio-org/stripes-sample-platform) for a good example.

The platform that Stripes CLI uses is influenced by the CLI context and constructed in the following order:

1. Base configuration:  When a file argument like `stripes.config.js` is provided, this will be used as the base.  Otherwise, the CLI will use its own internal defaults that contain no modules.

2. Virtual configuration:  In the APP context, the CLI will apply the current app as a module and generate an alias for the app to be run in isolation.  In the PLATFORM or APP context, the CLI will then add modules for all aliases defined, but only when an explicit module configuration is absent from `stripes.config.js`, or no `stripes.config.js` has been provided.

3. Command configuration: Any relevant options passed in on the command line are applied to the configuration last.

Tip: Use the `status` command (optionally with a file and/or other config options) to view the CLI's generated platform configuration in the current context.



### Aliases

Aliases are used to do associate platform modules with local code repositories in a development environment.  An alias is comprised of a key-value pair where the key is a module (`@folio/users`) and the value is the relative path to where the module (`../ui-users`) can be found.  Aliases are not limited to `@folio` scope modules.  At build time, any defined aliases will be applied to the Webpack configuration as Webpack aliases.

The initial goals of defining aliases was to facilitate serving an app in isolation, as well as eliminate the need for Yarn-linking modules for platform development.  The latter can be mitigated by using Yarn workspaces for the platform developer, however, aliases can still provide some advantages.  Aliases are easily added ad-hoc for debugging or testing.  They can work with modules outside the workspace, or used to share across workspaces.

There are two methods of adding aliases in the CLI:

1) `alias` command - This command manages aliases in a global collection.  Aliases defined with the `alias` command will be available for all commands, regardless of where they are run, until the alias is removed.  This command is useful for adding aliases ad-hoc and sharing an alias across multiple apps, platforms, or workspaces. See the [`alias` command](./commands.md#alias-command) for more detail.

1) `.stripesclirc` file - Any aliases defined in a CLI configuration file apply to commands run from the directory containing `.stripesclirc` file.  Use the configuration file when adding aliases in bulk or looking for a consistent set of alias. See the [CLI configuration](#configuration) for more information.


## Developing a new stripes app 

As a UI app developer, it is often preferred to develop your app independent from an entire platform.  This allows you to focus on your app's own code and not worry about how it is built or integrated within FOLIO.  The Stripes CLI provides all the necessary configuration to develop both new and existing apps in isolation.

Prerequisites:  The following assumes an existing Okapi backend, such as the FOLIO testing-backend Vagrant box, is installed and running locally on your development.  See (TODO: link here) on how to setup your the FOLIO testing-backend.

### Create your app

From a suitable directory, run the following:
```
stripes app create "Hello World --install"
```

This generate a skeleton Stripes UI app with sample routes and settings.  The CLI will transform the provided app name, "Hello World", to follow naming conventions where the `ui-` prefix or `@folio` scope is used.

```
Creating app...
{
  "appName": "hello-world",
  "appDescription": "an example app",
  "appDir": "ui-hello-world",
  "uiAppName": "ui-hello-world",
  "packageName": "@folio/hello-world",
  "displayName": "Hello World",
  "appRoute": "/helloworld",
  "componentName": "HelloWorld"
}
```

The `--install` option prompts the CLI to automatically run `yarn install` on the directory afterwards.  If the install option was omitted, please `cd` to the app's directory and run `yarn install`.

From here you can immediately start [running your app](#run-your-app), but it is best to properly post the app's module descriptor to Okapi and [assign permissions](#assigning-permissions).

*Tip:* If you've already [logged into Okapi](#interacting-with-okapi), you can do this all with one command:

```
stripes app create "Hello World" --install --push --assign diku_admin
```

In the above command, after creating an app and installing dependencies, `--push` will post the module descriptor to Okapi and enable the module for the tenant.  Next, `--assign` will assign the new app's default permissions to the user `diku_admin`.  See [assigning permissions](#assigning-permissions) below for details on how to perform these operations independently, or to add permissions later on during development.


### Assigning permissions

The new app created above contains the following permissions sets that Okapi needs to know about via module descriptor.  Once Okapi has the new app's module descriptor, the app can be assigned to a tenant, and permissions assigned to a user.  Doing so eliminates the need for setting `--hasAllPerms` during development.

```
"permissionSets": [
  {
    "permissionName": "module.hello-world.enabled",
    "displayName": "UI: Hello World module is enabled",
    "visible": true
  },
  {
    "permissionName": "settings.hello-world.enabled",
    "displayName": "Settings (hello-world): display list of settings pages",
    "subPermissions": [
      "settings.enabled"
    ],
    "visible": true
  }
]
```

To push your app's module descriptor, use the `mod add` command from within the app's directory.
```
stripes mod add
```

Next enable the module descriptor for your tenant:
```
stripes mod enable
```

Finally assign the app's default enabled permissions for a user:
```
stripes perm assign --name module.hello-world.enabled --user diku_admin
stripes perm assign --name settings.hello-world.enabled --user diku_admin
```

See Stripes-core's [Adding Permissions](https://github.com/folio-org/stripes-core/blob/master/doc/adding-permissions.md) for more detail and on how to manually add permissions.


### Run your app

After creating "Hello World" and installing dependencies, the new app is ready to run.  Change to the new app directory and serve your new app using a development server:

```
stripes serve
```

To specify your own tenant ID or to use an Okapi instance other than the default http://localhost:9130, pass the `--okapi` and `--tenant` options or set them in `.stripesclirc` file.
```
stripes serve --okapi http://my-okapi.example.com:9130 --tenant my-tenant-id
```

Note: When serving up a newly created app that either does not have a module descriptor in Okapi, or permissions assigned to the user, pass the `--hasAllPerms` option to display the app in the UI navigation.  While handy for initial development, `--hasAllPerms` should be avoided See [assigning permissions](#assigning-permissions) to eliminate the need for this. 

```
stripes serve --hasAllPerms
```

### Running tests

The newly created app as some basic UI end-to-end tests included designed to run with the Nightmare framework.  To run these tests, use the `test nightmare` command: 

```
stripes test nightmare --run demo --show
```

The `--run` option specifies the tests, in this case the sample tests included with our app are named "demo".  The `--show` option will display the UI while running the tests. 


### Including another Stripes module

Now that our Hello World app is up and running on its own, we may want to bring in an existing app for testing or further development.  The CLI makes this easy.  The following will demonstrate how to add `ui-users`.

From the directory above `ui-hello-world`, clone `ui-users` and install its dependencies.
```
git clone https://github.com/folio-org/ui-users.git
cd ui-users
yarn install
```

We should now have the following directory structure:
```
/ui-hello-world
/ui-users
```

Next add an alias for ui-users. Provide a relative path to the ui-users directory. Given you're in /ui-hello-world:
```
stripes alias add @folio/users ../ui-users
```

Now simply start the app up again.  From the ui-hello-world directory, run:
```
stripes serve
```

The FOLIO platform generated will now include ui-users!

Note: When adding an alias via the `alias add` command, the alias is considered global and will remain in effect for any command, run from any directory, until removed with `alias remove`.


## Developing multiple existing apps 

TODO:
* Whole platform/workspace setup
* Running tests for a platform
* Updating the platform


## Interacting with Okapi

When working with Okapi, it is easiest to set `okapi` and `tenant` options in a `.stripesclirc` file or environment variables.  Either method avoids the need  to manually supply `--okapi` and `--tenant` with each command.


## Generating a production build

## Viewing diagnostic output

## Authoring a CLI config file and its options
TODO:
* Writing a CLI plugin
