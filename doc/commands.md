# Stripes CLI Commands

This following command documentation is largely generated from the CLI's own built-in help.  Run each command with the `--help` option to see the latest for your currently installed CLI.

* [Common options](#common-options)
* [`app` command](#app-command)
    * [`app create` command](#app-create-command)
    * [`app perms` command](#app-perms-command)
    * [`app bigtest` command](#app-bigtest-command)
* [`serve` command](#serve-command)
* [`build` command](#build-command)
* [`test` command](#test-command)
    * [`test nightmare` command](#test-nightmare-command)
    * [`test karma` command](#test-karma-command)
* [`status` command](#status-command)
* [`workspace` command](#workspace-command)
* [`platform` command](#platform-command)
    * [`platform pull` command](#platform-pull-command)
    * [`platform clean` command](#platform-clean-command)
    * [`platform install` command](#platform-install-command)
    * [`platform backend` command (work in progress)](#platform-backend-command-work-in-progress)
* [`alias` command](#alias-command)
* [`okapi` command](#okapi-command)
    * [`okapi login` command](#okapi-login-command)
    * [`okapi logout` command](#okapi-logout-command)
    * [`okapi token` command](#okapi-token-command)
* [`mod` command](#mod-command)
    * [`mod add` command](#mod-add-command)
    * [`mod remove` command](#mod-remove-command)
    * [`mod enable` command](#mod-enable-command)
    * [`mod disable` command](#mod-disable-command)
    * [`mod update` command](#mod-update-command)
    * [`mod descriptor` command](#mod-descriptor-command)
    * [`mod list` command](#mod-list-command)
    * [`mod install` command](#mod-install-command)
    * [`mod view` command](#mod-view-command)
    * [`mod pull` command](#mod-pull-command)
* [`perm` command](#perm-command)
    * [`perm create` command](#perm-create-command)
    * [`perm assign` command](#perm-assign-command)
    * [`perm unassign` command](#perm-unassign-command)
    * [`perm view` command](#perm-view-command)


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
stripes build --help
```

Disable interactive option
```
stripes app create "Hello World" --no-interactive
```

## `app` command

Commands to create and manage stripes UI apps

Usage:
```
stripes app <command>
```

Sub-commands:
* `stripes app create [name]`
* `stripes app perms`
* `stripes app bigtest`


### `app create` command

Create a new Stripes app module

Usage:
```
stripes app create [name]
```


Positional | Description | Type | Notes
---|---|---|---
`name` | Name of the app | string |


Option | Description | Type | Notes
---|---|---|---
`--desc` | Description of the app | string |
`--install` | Yarn install dependencies | boolean | default: true
`--assign` | Assign new app permission to the given user (includes pushing module descriptor to Okapi and enabling for tenant) | string |


Examples:

Create new Stripes UI app, directory, and install dependencies:
```
stripes app create "Hello World"
```
Create app and assign permissions to user diku_admin:
```
stripes app create "Hello World" --assign diku_admin
```
Create new Stripes UI app, but do not install dependencies:
```
stripes app create "Hello World" --no-install
```

### `app perms` command

View list of permissions for the current app (app context)

Usage:
```
stripes app perms
```

Examples:

View current app permissions:
```
stripes app perms
```
Assign current app permissions to user diku_admin:
```
stripes app perms | stripes perm assign --user diku_admin
```

### `app bigtest` command

Setup BigTest for the current app

Usage:
```
stripes app bigtest
```

Option | Description | Type | Notes
---|---|---|---
`--install` | Yarn add dependencies | boolean | default: true

Examples:

Setup BigTest for the current app, and add dependencies:
```
stripes app bigtest
```
Setup BigTest for the current app, but do not add dependencies:
```
stripes app bigtest --no-install
```

## `serve` command

Serve up a development build of Stripes

Usage:
```
stripes serve [configFile]
```

Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string |


Option | Description | Type | Notes
---|---|---|---
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |
`--port` | Development server port | number | default: 3000
`--host` | Development server host | string |
`--cache` | Use HardSourceWebpackPlugin cache | boolean |
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--existing-build` | Serve an existing build from the supplied directory | string |
`--mirage` | Enable Mirage Server when available and optionally specify a scenario | string |
`--prod` | Use production build settings | boolean |
`--dev` | Use development build settings | boolean |
`--publicPath` | Specify the Webpack publicPath output option | string |
`--devtool` | Specify the Webpack devtool for generating source maps | string |
`--lint` | Show eslint warnings with build | boolean |
`--maxChunks` | Limit the number of Webpack chunks in build output | number |

Examples:

Serve an app (in app context) with permissions flag set for development:
```
stripes serve --hasAllPerms
```
Serve a platform defined by the supplied configuration:
```
stripes serve stripes.config.js
```
Serve a build previously created with "stripes build":
```
stripes serve --existing-build output
```
Serve an app (in app context) with a mock backend server":
```
stripes serve --mirage
```

## `build` command

Build a Stripes tenant bundle

Usage:
```
stripes build [configFile] [outputPath]
```


Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string |
`outputPath` | Directory to place build output | string |


Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |
`--output` | Directory to place build output | string |
`--sourcemap` | Include sourcemaps in build output | boolean |
`--analyze` | Run the Webpack Bundle Analyzer after build (launches in browser) | boolean |
`--prod` | Use production build settings | boolean |
`--dev` | Use development build settings | boolean |
`--publicPath` | Specify the Webpack publicPath output option | string |
`--devtool` | Specify the Webpack devtool for generating source maps | string |
`--lint` | Show eslint warnings with build | boolean |
`--maxChunks` | Limit the number of Webpack chunks in build output | number |


Examples:

Platform context build:
```
stripes build stripes.config.js dir
```
App context build using virtual platform:
```
stripes build --output=dir
```


## `test` command

Run the current app module's tests

Usage:
```
stripes test
```

Sub-commands:
* `stripes test karma [configFile]`
* `stripes test nightmare [configFile]`


Option | Description | Type | Notes
---|---|---|---
`--port` | Development server port | number | default: 3000
`--host` | Development server host | string |
`--cache` | Use HardSourceWebpackPlugin cache | boolean |
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |


Examples:

Serve app and run it's demo.js Nightmare tests:
```
stripes test nightmare --run=demo
```
Run Karma tests for the current app module:
```
stripes test karma
```

### `test nightmare` command
Run the current app module's Nightmare tests

Usage:
```
stripes test nightmare [configFile]
```


Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string |


Option | Description | Type | Notes
---|---|---|---
`--port` | Development server port | number | default: 3000
`--host` | Development server host | string |
`--cache` | Use HardSourceWebpackPlugin cache | boolean |
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |
`--run` | Name of the test script to run | string |
`--show` | Show UI and dev tools while running tests | boolean |
`--url` | URL of FOLIO UI to run tests against | string |
`--local` | Shortcut for --url http://localhost:3000 | boolean | defaults to --host and --port
`--uiTest` | Additional options for ui-testing framework |  |


Examples:

Serve app or platform and run all of its Nightmare tests:
```
stripes test nightmare
```
Serve app or platform and run its demo.js Nightmare tests:
```
stripes test nightmare --run demo
```
Run Nightmare tests against a locally hosted instance of FOLIO:
```
stripes test nightmare --local
```
Run Nightmare tests against an external instance of FOLIO:
```
stripes test nightmare --url http://folio-testing.aws.indexdata.com/
```
Specify a username via ui-testing's test-module CLI options:
```
stripes test nightmare --uiTest.username admin
```


### `test karma` command
Run the current app module's Karma tests

Usage:
```
stripes test karma [configFile]
```


Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string |


Option | Description | Type | Notes
---|---|---|---
`--port` | Development server port | number | default: 3000
`--host` | Development server host | string |
`--cache` | Use HardSourceWebpackPlugin cache | boolean |
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |
`--coverage` | Enable Karma coverage reports | boolean |
`--karma` | Options passed to Karma using dot-notation and camelCase: --karma.browsers=Chrome --karma.singleRun |  |


Examples:

Run tests with Karma for the current app module:
```
stripes test karma
```


## `status` command

Display Stripes CLI status information

Usage:
```
stripes status [configFile]
```

Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string |


Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean |
`--languages` | Languages to include in tenant build | array |
`--platform` | View development platform status | boolean |



## `workspace` command

Create a Yarn workspace for Stripes development, select modules, clone, and install.

Usage:
```
stripes workspace
```

Option | Description | Type | Notes
---|---|---|---
`--dir` | Directory to create | string | default: stripes
`--modules` | Stripes modules to include | array |
`--default.okapi` | Default Okapi URL for CLI config | string | default: http://localhost:9130
`--default.tenant` | Default tenant for CLI config | string | default: diku
`--clone` | Clone the selected modules's repositories | boolean | default: true
`--install` | Install dependencies | boolean | default: true


Examples:

Create a "stripes" dir and prompt for modules:
```
stripes workspace
```
Create an "temp" dir and prompt for modules:
```
stripes workspace --dir temp
```
Create and select ui-users and stripes-core:
```
stripes workspace --modules ui-users stripes-core
```
Create and select all available modules:
```
stripes workspace --modules all
```
Create without installing dependencies:
```
stripes workspace --no-install
```



## `platform` command

Commands to manage stripes UI platforms

Usage:
```
stripes platform <command>
```

Sub-commands:
* `stripes platform clean`
* `stripes platform install`
* `stripes platform pull`


### `platform pull` command

Git pull latest code for a platform or workspace including aliases

Usage:
```
stripes platform pull
```


Examples:

Pull all clean repositories including aliases:
```
stripes platform pull
```



### `platform clean` command

Remove node_modules for active platform, workspace, and aliases

Usage:
```
stripes platform clean
```


Option | Description | Type | Notes
---|---|---|---
`--install` | Install dependencies after cleaning | boolean | default: false


Examples:

Clean and reinstall dependencies:
```
stripes platform clean --install
```
Clean only:
```
stripes platform clean
```


### `platform install` command

Yarn install platform or workspace dependencies including aliases

Usage:
```
stripes platform install
```

### `platform backend` command (work in progress)

Initialize Okapi backend for a platform

Usage:
```
stripes platform backend [configFile]
```

Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)
`--simulate` | Simulate install only (does not deploy) | boolean | default: false
`--preRelease` | Include pre-release modules | boolean | default: true
`--remote` | Pull module descriptors from remote registry before install | string | 
`--include` | Additional module ids to include with install | array | 
`--detail` | Display detailed output | boolean | default: false

Examples:

Deploy, enable, and/or upgrade modules to support the current platform:
```
stripes platform backend stripes.config.js
```
View modules that need to enabled/upgraded for the current platform:
```
stripes platform backend stripes.config.js --simulate --detail
```
Pull module descriptors from remote Okapi prior to install:
```
stripes platform backend stripes.config.js --remote http://folio-registry.aws.indexdata.com
```
Include modules "one" and "two" not specified in tenant config:
```
stripes platform backend stripes.config.js --include one two
```

## `alias` command
Maintain global aliases that apply to all platforms and apps

Usage:
```
stripes alias <sub> [mod] [path]
```


Positional | Description | Type | Notes
---|---|---|---
`sub` | Alias operation | string | (*) choices: "add", "list", "remove", "clear"
`mod` | UI module to alias | string |
`path` | Relative path to UI module | string |


Examples:

stripes alias remove @folio/ui-users:
```
stripes alias add @folio/ui-users ./path/to/ui-users
```

## `okapi` command

Okapi commands (login and logout)

Usage:
```
stripes okapi <command>
```

Sub-commands:
* `stripes okapi login <username> [password]`
* `stripes okapi logout`
* `stripes okapi token`


### `okapi login` command

Log into an Okapi tenant persist the token

Usage:
```
stripes okapi login <username> [password]
```


Positional | Description | Type | Notes
---|---|---|---
`username` | Okapi tenant username | string | (*)
`password` | Okapi tenant password | string |


Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)


Examples:

```
stripes okapi login diku_admin --okapi http://localhost:9130 --tenant diku
```

Given okapi and tenant are already set:
```
stripes okapi login diku_admin
```


### `okapi logout` command

Clear previously saved Okapi token.

Usage:
```
stripes okapi logout
```

### `okapi token` command

Display the stored Okapi token

Examples:

Display the stored Okapi token:
```
stripes okapi token
```


## `mod` command

Commands to manage UI module descriptors

Usage:
```
stripes mod <command>
```

Sub-commands:
* `stripes mod add`
* `stripes mod descriptor`
* `stripes mod disable`
* `stripes mod enable`
* `stripes mod install`
* `stripes mod list`
* `stripes mod pull`
* `stripes mod remove`
* `stripes mod update`
* `stripes mod view`

### `mod add` command

Add an app module descriptor to Okapi

Usage:
```
stripes mod add
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--strict` | Include required interface dependencies | boolean | default: false

Examples:

Add descriptor for ui-module in current directory:
```
stripes mod add
```

### `mod remove` command

Remove a module descriptor from Okapi

Usage:
```
stripes mod remove
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--ids` | Module descriptor ids  | array | supports stdin

Examples:

Remove ui-module located in current directory:
```
stripes mod remove
```
Remove module ids "one" and "two" from Okapi:
```
stripes mod remove --ids one two
```
Remove module ids "one" and "two" from Okapi with stdin:
```
echo one two | stripes mod remove
```

### `mod enable` command

Enable an app module descriptor for a tenant in Okapi

Usage:
```
stripes mod enable
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)
`--ids` | Module descriptor ids  | array | supports stdin

Examples:

Enable the current ui-module (app context):
```
stripes mod enable --tenant diku
```
Enable module ids "one" and "two" for tenant diku:
```
stripes mod enable --ids one two --tenant diku
```
Enable module ids "one" and "two" for tenant diku with stdin:
```
echo one two | stripes mod enable --tenant diku
```

### `mod disable` command

Disable modules for a tenant in Okapi

Usage:
```
stripes mod disable
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)
`--ids` | Module descriptor ids  | array | supports stdin

Examples:

Disable the current ui-module (app context):
```
stripes mod disable --tenant diku
```
Disable module ids "one" and "two" for tenant diku:
```
stripes mod disable --ids one two --tenant diku
```
Disable module ids "one" and "two" for tenant diku with stdin:
```
echo one two | stripes mod disable --tenant diku
```

### `mod update` command

Update an app module descriptor in Okapi

Usage:
```
stripes mod update
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)

Examples:

Update descriptor for ui-module in current directory:
```
stripes mod update
```

### `mod descriptor` command

Generate module descriptors for an app or platform.

Usage:
```
stripes mod descriptor [configFile]
```

Positional | Description | Type | Notes
---|---|---|---
`configFile` | File containing a Stripes tenant configuration (platform context only) | string | 

Option | Description | Type | Notes
---|---|---|---
`--full` | Return full module descriptor JSON | boolean | default: false
`--strict` | Include required interface dependencies | boolean | default: false

Examples:

Display module descriptor id for current app:
```
stripes mod descriptor
```
Display module descriptor ids for platform:
```
stripes mod descriptor stripes.config.js
```
Display full module descriptor as JSON:
```
stripes mod descriptor --full
```

### `mod list` command

List all module ids available in Okapi or enabled for a tenant

Usage:
```
stripes mod list
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string |

Examples:

List enabled module ids for tenant diku:
```
stripes mod list --tenant diku
```
List all available module ids in Okapi:
```
stripes mod list
```
List available module ids in Okapi (overriding any tenant set via config):
```
stripes mod list --no-tenant
```

### `mod install` command

Enable, disable, and optionally deploy one or more modules for a tenant in Okapi

Usage:
```
stripes mod install
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)
`--simulate` | Simulate operation | boolean | default: false
`--action` | Action to perform on modules | string | choices: "enable", "disable"
`--deploy` | Deploy modules | boolean | default: false
`--preRelease` | Include pre-release modules | boolean | default: true
`--ids` | Module descriptor ids  | array | supports stdin

Examples:

Install and deploy module ids "one" and "two":
```
stripes mod install --ids one two --tenant diku --deploy
```
Disable module ids "one" and "two":
```
stripes mod install --ids one two --tenant diku --action disable
```
Install module ids "one" and "two" using stdin:
```
echo one two | stripes mod install --tenant diku
```

### `mod view` command

View module descriptors of module ids in Okapi

Usage:
```
stripes mod view
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--ids` | Module descriptor ids  | array | supports stdin

Examples:

View module descriptors for ids "one" and "two":
```
stripes mod view --ids one two
```
View module descriptors for ids "one" and "two" with stdin:
```
echo one two | stripes mod view
```

### `mod pull` command

Pull module descriptors from a remote okapi

Usage:
```
stripes mod pull
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--remote` | Remote Okapi to pull from | string | (*)

Examples:

Pull module descriptors from remote Okapi:
```
stripes mod pull --okapi http://localhost:9130 --remote http://folio-registry.aws.indexdata.com
```

## `perm` command

Commands to manage UI module permissions

Usage:
```
stripes perm <command>
```

Sub-commands:
* `stripes perm assign`
* `stripes perm create [name]`
* `stripes perm unassign`
* `stripes perm view`


### `perm create` command

Adds new UI permission to permissionSet

Usage:
```
stripes perm create [name]
```


Positional | Description | Type | Notes
---|---|---|---
`name` | Name of the permission | string |


Option | Description | Type | Notes
---|---|---|---
`--desc` | Description of the permission | string |
`--visible` | Permission is visible in the UI | boolean | default: true
`--okapi` | Specify an Okapi URL | string |
`--tenant` | Specify a tenant ID | string |
`--push` | Push the permission to Okapi by adding/updating module descriptor | boolean | default: false
`--assign` | Assign the permission to the given user (requires --push) | string |


Examples:

Create a new permission for this UI module:
```
stripes perm create ui-my-app.example
```
Create a new permission, update the module descriptor, and assign permission to user someone:
```
stripes perm create ui-my-app.example --push --assign someone
```


### `perm assign` command
Assign permission to a user

Usage:
```
stripes perm assign
```

Option | Description | Type | Notes
---|---|---|---
`--name` | Name of the permission | string | supports stdin
`--user` | Username to assign permission to | string | alias: assign
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)

Examples:

Assign permission to user diku_admin:
```
stripes perm assign --name module.hello-world.enabled --user diku_admin
```
Assign permissions from user jack to user jill:
```
stripes perm view --user jack | stripes perm assign --user jill
```

### `perm unassign` command
Unassign permissions from a user

Usage:
```
stripes perm unassign
```

Option | Description | Type | Notes
---|---|---|---
`--name` | Name of the permission | string | supports stdin
`--user` | Username to unassign permission from | string |
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)


Examples:

Unassign permission from user diku_admin:
```
stripes perm unassign --name module.hello-world.enabled --user diku_admin
```


### `perm view` command

View permissions for a user

Usage:
```
stripes perm view
```

Option | Description | Type | Notes
---|---|---|---
`--okapi` | Specify an Okapi URL | string | (*)
`--tenant` | Specify a tenant ID | string | (*)
`--user` | Username | string | (*)


Examples:

View permissions for user diku_admin:
```
stripes perm view --user diku_admin
```
