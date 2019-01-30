# Stripes CLI

Copyright (C) 2017-2019 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

Stripes CLI is a command line interface to facilitate the creation, development, building, and testing of Stripes UI modules.

* [User Guide](./doc/user-guide.md)
* [List of Commands](./doc/commands.md)
* [Developer Guide](./doc/dev-guide.md)
* [Troubleshooting](./doc/troubleshooting.md)

## Installation

Stripes CLI is available on both the `npm-folio` and `npm-folioci` registries.  Refer to [configuring the FOLIO registry](https://github.com/folio-org/stripes/blob/master/doc/new-development-setup.md#configure-the-folio-registry) for information on which registry to use. The following shows how to install the CLI globally from `npm-folio`:
```
yarn config set @folio:registry https://repository.folio.org/repository/npm-folio/
yarn global add @folio/stripes-cli
```

*Yarn on Windows:* Please see [this troubleshooting note](./doc/troubleshooting.md#global-install-on-windows-with-yarn-151) regarding global installation issues.

## Upgrading

Upgrade your globally installed CLI with the following command:
```
yarn global upgrade @folio/stripes-cli
```

If your CLI is installed locally, use:
```
yarn upgrade @folio/stripes-cli
```

## Issues

See project [STCLI](https://issues.folio.org/browse/STCLI) in the [FOLIO issue tracker](https://dev.folio.org/guidelines/issue-tracker).
