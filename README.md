# Stripes CLI

Copyright (C) 2017 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

*Note: This is an early prototype and not ready to fully scaffold a new Stripes UI module.*

Stripes CLI is a command line interface to facilitate the creation, development, building, and testing of Stripes UI modules.

## Installation

Stripes CLI is currently not published to `npm-folio`.  This will change once it becomes more stable.  To install the CLI now, use the `npm-folioci` registry.
```
npm config set @folio:registry https://repository.folio.org/repository/npm-folioci/
npm install -g @folio/stripes-cli
```

To develop the CLI:
1. Clone this repo
1. From the `stripes-cli` directory, run: `npm install -g`

## Running Stripes-CLI

Stripes CLI is currently invoked using `stripescli` rather than `stripes` so it can run side-by-side with commands integrated within stripes-core. Eventually stripes-cli will be invoked using `stripes` once the CLI is stable and proven to be a suitable replacement.

Note: When serving or building an existing app module that has dependencies on unreleased versions of other Stripes modules, be sure to use the `npm-folioci` registry.

## Available commands

Run each command with `--help` to view all available options and more examples.
```
stripescli build --help
```

### `new` command (work in progress)

Creates a new Stripes module, directory, and optionally yarn install its dependencies.  Currently this command only supports the creation of UI app modules, but could be extended to create plugins, platforms, components, and tests.

The skeleton module created by `new app` can be served up right away, but is limited to a demonstrating a very simple set of static pages at the moment.

Example:
```
stripescli new app "Hello World" --install
```

### `serve` command

Build Stripes tenant bundle and launch a development web server. Given a file argument like `stripes.config.js`, `serve` will operate much like the `dev` command does today in stripes-core.

In an APP context, `serve` will generate a virtual platform containing just the current app module.  This is most useful for developing a new ui-app in isolation within its own virtual platform as there is no need clone or link supporting repositories.

In order to view and log into the platform being served up, a suitable OKAPI backend will need to be running. The [Folio testing-backend](https://app.vagrantup.com/folio/boxes/testing-backend) Vagrant box should work when serving up a newly created app that does not yet have its own backend module.

Note: When serving up a newly created app that does not have its own backend permissions established, pass the `--hasAllPerms` option to display the app in the UI navigation.

Example:
```
stripescli serve --port=8080 --hasAllPerms
```


### `build` command

Build a Stripes tenant bundle and save build artifacts to a directory.  Given a file argument like `stripes.config.js`, `build` will operate much like `build` does today in stripes-core.  However, stripes-cli will now generate a config when the file is omitted (APP context).

The output directory can now be supplied as an option `--output`.  This differs from stripes-core's `build` command which only used a positional argument.  This was done to accommodate building of virtual platforms which do not require passing a stripes configuration file.

Example:
```
stripescli build stripes.config.js ./path/to/directory
```

Note: Builds intended for production should be made using a previously defined platform with its own yarn installed dependencies, including stripes-core, no yarn linking, and no aliases set in the CLI.


### `test` command (work in progress)

Runs tests for an app in the APP context.  Right now `test` only supports UI integration tests written for NightmareJS.  

Integration tests support a small subset of the options available in [ui-testing](https://github.com/folio-org/ui-testing).  This includes `--run`, `--host`, and `--port`.  Note: The `--run` option varies slightly from ui-testing in that it should be supplied with only a test script name (`--run=<script>`) and not include the app name as it does today (`--run=<app:script>`).

Example:
```
stripescli test --run=demo --show
```

### `alias` command

Create and persists Webpack resolve aliases for use when building a platform. Sub-commands include `add`, `remove`, `list`, and `clear`.  These are applied automatically to builds in both app and platform contexts.

Example:
```
stripescli alias add @folio/users ./path/to/ui-users
```
Note:  UI module aliases should not be used in production builds.  As with yarn linking, a module aliased to a separately yarn installed repository will have no overlap for common dependencies, resulting in a larger bundle.


### `status` command

Display information about the CLI, including the inferred context which it is running.  The status output also includes the Stripes config JSON used when generating a virtual platform in the current context.  Any aliases that have been set are also noted.

Example:
```
stripescli status
```

## Note about context

Certain CLI operations will vary depending on the context in which the command was run.  Stripes CLI will attempt to infer the context.  Contexts include:

- APP:  Used when a package.json containing `stripes` is present.  Context actually matches the `stripes.type` property, but only "app" is currently supported.
- PLATFORM: Used when a package.json containing one or more `@folio/` dependencies is found, but no `stripes` object.
- EMPTY:  No package.json detected.  Suitable for creating new UI modules

Use the `status` command to view the current context.

## Note about platforms

Stripes UI modules are meant to be built together with other modules in a platform that shares common build infrastructure.  A platform consists of a `package.json` and a tenant configuration typically named `stripes.config.js`. See the [Stripes Sample Platform](https://github.com/folio-org/stripes-sample-platform) for a good example.  

The platform that Stripes CLI uses is constructed in the following order:

1. Base configuration:  When a file argument like `stripes.config.js` is provided, this will be used as the base.  Otherwise, the CLI will use its own internal defaults that contain no modules.

2. Virtual configuration:  In the APP context, the CLI will apply the current app as a module and generate an alias for the app to be run in isolation.  In the PLATFORM context, the CLI will add modules for all aliases previously defined with the `alias` command.

3. Command configuration: Any relevant options passed in on the command line are applied to the configuration last.

Tip: Use the `status` command (optionally with a file and/or other config options) to view the CLI's generated platform configuration in the current context.
