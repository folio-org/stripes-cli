# Stripes CLI

Copyright (C) 2017 The Open Library Foundation

This software is distributed under the terms of the Apache License,
Version 2.0. See the file "[LICENSE](LICENSE)" for more information.

## Introduction

*Note: This is an early prototype and not ready to fully scaffold a new Stripes UI module.*

Stripes CLI is a command line interface to facilitate the creation, development, building, and testing of Stripes UI modules.

## Installation

Stripes CLI is currently unpublished, so a quick way to take it for a spin is to run:
```
npm install -g folio-org/stripes-cli
```

To develop the CLI:
1. Clone this repo
1. From the `stripes-cli` directory, run:
```
npm install -g
```

## Available commands

Stripes CLI is currently invoked using `str` rather than `stripes` so it can run side-by-side with commands currently integrated within stripes-core.

* `serve` or `dev`: Serve up an app or platform with the development server.
* `build`: Build a static tenant bundle.
* `new`: Create a new UI module (work in progress).
* `test`: Runs tests (not implemented).

Run each command with `--help` to view available options.

Previous `dev` and `build` commands continue to work as expected for existing platforms given a file argument like `stripes.config.js` is provided.  However, stripes-cli will now generate a config when the config file is omitted.  This is most useful for developing a new ui-app in isolation within its own virtual platform as there is no need clone or link supporting repositories.


## Example usage

Create a new stripes UI app and directory: 
```
str new app "Hello World"
```

Run the newly created stripes UI app from within its own directory:
```
str serve --allperms
```
(This assumes dependencies have previously been yarn installed and a suitable OKAPI backend is running locally on port 9130)
