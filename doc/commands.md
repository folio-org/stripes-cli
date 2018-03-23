# Stripes CLI Commands

This following command documentation is largely generated from the the CLI's own built-in help.  Run each command with the `--help` option to see the latest for your currently installed CLI.

* [Common options](#common-options)
* [`app` command](#app-command)
    * [`app create` command](#app-create-command)
* [`serve` command](#serve-command)
* [`build` command](#build-command)
* [`test` command (work in progress)](#test-command-work-in-progress)
    * [`test nightmare` command](#test-nightmare-command)
    * [`test karma` command](#test-karma-command)
* [`status` command](#status-command)
* [`platform` command (work in progress)](#platform-command-work-in-progress)
    * [`platform create` command](#platform-create-command)
    * [`platform pull` command](#platform-pull-command)
    * [`platform clean` command](#platform-clean-command)
    * [`platform install` command](#platform-install-command)
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
* [`perm` command](#perm-command)
    * [`perm create` command](#perm-create-command)
    * [`perm assign` command](#perm-assign-command)
    * [`perm view` command](#perm-view-command)


## Common options

The following options are available for all commands:

Option | Description | Type | Info
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


### `app create` command

Create a new Stripes app module

Usage:
```
stripes app create [name]
```


Positional | Description | Type | Info
---|---|---|---
`name` | Name of the app | string | 


Option | Description | Type | Info
---|---|---|---
`--desc` | Description of the app | string | 
`--install` | Yarn install dependencies | boolean | 
`--push` | Push new app module descriptor to Okapi (use "mod add" to do so later) | boolean | 
`--assign` | Assign new app permission to the given user (requires --push) | string | 



Examples:

Create new Stripes UI app and directory:
```
stripes app create "Hello World"
```
Create new Stripes UI app, directory, and install dependencies:
```
stripes app create "Hello World" --install
```


## `serve` command

Serve up a development build of Stripes

Usage:
```
stripes serve [configFile]
```


Positional | Description | Type | Info
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 


Option | Description | Type | Info
---|---|---|---
`--uiDev` | Include Stripes ui-developer tools (app context) | boolean | 
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean | 
`--port` | Development server port | number | default: 3000 
`--host` | Development server host | string | 
`--cache` | Use HardSourceWebpackPlugin cache | boolean | 
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--existing-build` | Serve an existing build from the supplied directory | string | 
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


## `build` command

Build a Stripes tenant bundle

Usage:
```
stripes build [configFile] [outputPath]
```


Positional | Description | Type | Info
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 
`outputPath` | Directory to place build output | string | 


Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean | 
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


## `test` command (work in progress)

Run the current app module's tests

Usage:
```
stripes test
```

Sub-commands:
* `stripes test karma [configFile]`
* `stripes test nightmare [configFile]`


Option | Description | Type | Info
---|---|---|---
`--port` | Development server port | number | default: 3000 
`--host` | Development server host | string | 
`--cache` | Use HardSourceWebpackPlugin cache | boolean | 
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean | 


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


Positional | Description | Type | Info
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 


Option | Description | Type | Info
---|---|---|---
`--port` | Development server port | number | default: 3000 
`--host` | Development server host | string | 
`--cache` | Use HardSourceWebpackPlugin cache | boolean | 
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean | 
`--run` | Name of the test script to run | string | 
`--show` | Show UI and dev tools while running tests | boolean | 


Examples:

Serve app and run it's demo.js Nightmare tests:
```
stripes test nightmare --run=demo
```

### `test karma` command
Run the current app module's Karma tests

Usage:
```
stripes test karma [configFile]
```


Positional | Description | Type | Info
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 


Option | Description | Type | Info
---|---|---|---
`--port` | Development server port | number | default: 3000 
`--host` | Development server host | string | 
`--cache` | Use HardSourceWebpackPlugin cache | boolean | 
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--hasAllPerms` | Set "hasAllPerms" in Stripes config | boolean | 
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

Positional | Description | Type | Info
---|---|---|---
`configFile` | File containing a Stripes tenant configuration | string | 


Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--platform` | View development platform status | boolean | 





## `platform` command (work in progress)

Commands to create and manage stripes UI platforms

Usage:
```
stripes platform <command>
```

Sub-commands:
* `stripes platform clean`
* `stripes platform create [name]`
* `stripes platform install`
* `stripes platform pull`



### `platform create` command

Create a new development environment, clone, and install.

Usage:
```
stripes platform create [name]
```


Positional | Description | Type | Info
---|---|---|---
`name` | Directory to create | string | 


Option | Description | Type | Info
---|---|---|---
`--modules` | Stripes modules to include | array | 
`--workspace` | Include a Yarn Workspaces configuration | boolean | default: true 
`--clone` | Clone the selected modules's repositories | boolean | default: true 
`--install` | Install dependencies | boolean | default: true 


Examples:

Create a "stripes" dir and prompt for modules:
```
stripes platform create
```
Create an "example" dir and prompt for modules:
```
stripes platform create example
```
Create and select ui-users and stripes-core:
```
stripes platform create --modules ui-users stripes-core
```
Create and select all available modules:
```
stripes platform create --modules all
```
Create without a Yarn workspace:
```
stripes platform create --no-workspace
```
Create without a installing dependencies:
```
stripes platform create --no-install
```


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


Option | Description | Type | Info
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

## `alias` command
Maintain global aliases that apply to all platforms and apps

Usage:
```
stripes alias <sub> [mod] [path]
```


Positional | Description | Type | Info 
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


Positional | Description | Type | Info
---|---|---|---
`username` | Okapi tenant username | string | (*) 
`password` | Okapi tenant password | string | 


Option | Description | Type | Info
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
* `stripes mod disable`
* `stripes mod enable`
* `stripes mod remove`
* `stripes mod update`

### `mod add` command

Add an app module descriptor to Okapi

Usage:
```
stripes mod add
```

Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 

Examples:

```
stripes mod add
```

### `mod remove` command

Remove an app module descriptor from Okapi

Usage:
```
stripes mod remove
```

Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 


Examples:

```
stripes mod remove
```

### `mod enable` command

Enable an app module descriptor for a tenant in Okapi

Usage:
```
stripes mod enable
```


Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 


Examples:

```
stripes mod enable
```


### `mod disable` command

Disable an app module descriptor for a tenant in Okapi

Usage:
```
stripes mod disable
```

Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 

Examples:

```
stripes mod disable
```


### `mod update` command

Update an app module descriptor in Okapi

Usage:
```
stripes mod update
```


Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 

```
stripes mod update
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
* `stripes perm view`


### `perm create` command

Adds new UI permission to permissionSet

Usage:
```
stripes perm create [name]
```


Positional | Description | Type | Info
---|---|---|---
`name` | Name of the permission | string | 


Option | Description | Type | Info
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

Option | Description | Type | Info
---|---|---|---
`--name` | Name of the permission | string | 
`--user` | Username to assign permission to | string | alias: assign  
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 

Examples:
```
stripes perm assign
```

### `perm view` command

View permissions for a user

Usage:
```
stripes perm view
```

Option | Description | Type | Info
---|---|---|---
`--okapi` | Specify an Okapi URL | string | 
`--tenant` | Specify a tenant ID | string | 
`--user` | Username | string | (*) 


Examples:

View permissions for user diku_admin:
```
stripes perm view --user diku_admin
```
