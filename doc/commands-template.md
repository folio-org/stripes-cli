# Stripes CLI Commands

Version <%= version %>

This following command documentation is generated from the CLI's own built-in help.  Run any command with the `--help` option to view the latest help for your currently installed CLI.  To regenerate this file, run `yarn docs`.

> Note: Commands labeled "(work in progress)" are incomplete or experimental and subject to change.

* [Common options](#common-options)
<%= toc %>
* [`completion` command](#completion-command)


## Common options

The following options are available for all commands:

Option | Description | Type | Notes
---|---|---|---
`--help` | Show help | boolean |
`--version` | Show version number | boolean |
`--interactive` | Enable interactive input (use --no-interactive to disable) | boolean | default: true

Examples:

Show help for the build command:
```
$ stripes build --help
```

Disable interactive option
```
$ stripes app create "Hello World" --no-interactive
```

<%= commands %>

## `completion` command

Generate a bash completion script.  Follow instructions included with the script for adding it to your bash profile.

Usage:
```
$ stripes completion
```
