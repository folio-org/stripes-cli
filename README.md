# Stripes CLI

Copyright (C) 2017-2018 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

Stripes CLI is a command line interface to facilitate the creation, development, building, and testing of Stripes UI modules.

* [User Guide](./doc/user-guide.md)
* [List of Commands](./doc/commands.md)
* [Developer Guide](./doc/dev-guide.md)

## Installation

Stripes CLI is available on both the `npm-folio` and `npm-folioci` registries.  The following shows how to install the CLI globally from `npm-folioci`:
```
yarn config set @folio:registry https://repository.folio.org/repository/npm-folioci/
yarn global add @folio/stripes-cli
```

## Upgrading

Upgrade your globally installed CLI with the following command:
```
yarn global upgrade @folio/stripes-cli
```
