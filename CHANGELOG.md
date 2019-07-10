# Change history for stripes-cli

## 1.13.0 (IN PROGRESS)

* Upgrade `karma-webpack` dependency to `^4.0.2`, handles FOLIO-2139
* Added checking of `stripes.actsAs` when determining `isUiModule`, handles STCOR-148
* stripes-testing `v1.6.0` includes `checkout`, `setCirculationRules` helpers.

## [1.12.1](https://github.com/folio-org/stripes-cli/tree/v1.12.1) (2019-06-11)

* Upgrade bundle analyzer to avoid security vulnerability WS-2019-0058.

## [1.12.0](https://github.com/folio-org/stripes-cli/tree/v1.12.0) (2019-05-15)

* Upgrade stripes-testing dependency to `v1.5.0`.
* Include ui-tenant-settings in `lib/environment`, exposing it as testable.

## [1.11.0](https://github.com/folio-org/stripes-cli/tree/v1.11.0) (2019-05-14)

* New `okapi get/post/put/delete` commands to support arbitrary Okapi HTTP requests, STCLI-135
* Upgrade inquirer dependency. Resolves STCLI-136
* Upgrade stripes-testing dependency. Refs STCLI-137.

## [1.10.0](https://github.com/folio-org/stripes-cli/tree/v1.10.0) (2019-03-06)

* Check for TTY before calling getStdin(), fixes STCLI-131
* Update ui-module blueprint to use stripes 2.0
* Add mocha-jenkins-reporter and support passing of `--reporter` option for Nightmare tests, STCLI-84
* Add support for `mod add` to accept existing module descriptors via stdin, STCLI-127


## [1.9.0](https://github.com/folio-org/stripes-cli/tree/v1.9.0) (2019-02-13)

* Facilitate connection of a locally hosted back-end module with Okapi, STCLI-114
  * New isBackendModule context to identify back-end modules
  * Support back-end module context for `mod add/remove/enable/disable` commands
  * New `mod discover` command to register instances with Okapi
* New mod descriptor `--output` option for writing module descriptors to a directory, STCLI-125
* Automate generation of CLI command reference, STCLI-128
* Refactor usage of context.type, STCLI-78
* Implement CLI context, prompts, and stdin handlers as Yargs middleware, STCLI-99
* New middleware for loading stripes config files and applying okapi/tenant, STCLI-117
* Add support to filter permissions by assigned/unassigned, STCLI-126


## [1.8.0](https://github.com/folio-org/stripes-cli/tree/v1.8.0) (2019-01-16)

* Add sample API request to ui-app template, STCLI-98
* New `mod perms` command to list permission for one or more modules, STCLI-115
* Support permission assignment via `platform backend` command, STCLI-115
* Rename `perm view` to `perm list` for consistency
* Use caret version for CLI in workspace template, fixes STCLI-123
* Remove deprecated `folio-testing-platform` from selection during `workspace` command, FOLIO-1370
* Upgrade to Yargs 12.x
* Remove "--modules all" option, fixes STCLI-83
* Add `provide` and `require` options to `mod list` command, STCLI-120
* Guard against unset karma options, fixes STCLI-124
* Add support for `stripes-core` `v3.x`


## [1.7.0](https://github.com/folio-org/stripes-cli/tree/v1.7.0) (2018-11-29)

* Rename `mod view` to `mod list` and add support for listing all module ids, STCLI-79
* New `mod view` implementation to view module descriptors given ids, STCLI-79
* Update app module template with new translation directory, STCLI-67
* Augment core API with dependencies used for generating descriptors, fixes STCLI-111
* Extend Okapi interactions to facilitate setup of back-end platform dependencies, STCLI-15
  * Pull module descriptors from remote Okapi registry with `mod pull`
  * `mod remove` now supports multiple descriptor ids
  * Enable/disable and optionally deploy modules via `mod install`
  * Deploy, enable, and upgrade modules for a platform via `platform backend`
* Dynamically apply CLI devDependency version for new app and workspace, STCLI-109
* Use correct relative path for package.json in `workspace` command, fixes STCLI-121
* Support using `mod install` simulate output as input for subsequent calls to command, STCLI-116


## [1.6.0](https://github.com/folio-org/stripes-cli/tree/v1.6.0) (2018-10-19)

* Remove HMR plugin during Karma tests
* Update ui-app blueprint to use stripes framework, STCLI-108
* Add BigTest infrastructure blueprint and bootstrap command, STCLI-85


## [1.5.0](https://github.com/folio-org/stripes-cli/tree/v1.5.0) (2018-09-24)

* On pull, highlight updated repositories
* Correct isPlatform logic, fixes STCLI-104
* Start new apps at v1.0.0. Fixes STCLI-105
* Upgrade `debug` dependency, STRIPES-553
* Enable module for tenant via `perm create` command, fixes STCLI-106
* Enable serve/test of stripes-* modules based on inventory


## [1.4.0](https://github.com/folio-org/stripes-cli/tree/v1.4.0) (2018-09-10)

* Switched from `karma-coverage` to `karma-coverage-istanbul-reporter`
* Resolve issue causing nightmare command to throw an error even when tests pass, fixes STCLI-86
* STCLI-88 resolved. Resolved an issue where command test nightmare would not return process error when failing
* Enable shell when spawning child process on Windows, fixes STCLI-89
* Replace `ui-testing#framework-only` with `stripes-testing`, STCLI-92
* Allow testing of settings modules, STCLI-91
* Include platforms in logic that generates --run option for stripes-testing, STCLI-100
* Don't throw warning when serving `settings` modules


## [1.3.0](https://github.com/folio-org/stripes-cli/tree/v1.3.0) (2018-08-07)

* Highlight failed git-pull attempts in a dumb-terminal-friendly way.
* Invoke Nightmare tests with ui-testing's copy of test-module, STCLI-5
* Generate HTML coverage reports with Istanbul
* Add non-headless Chrome custom launcher config, STCLI-70
* Add perm unassign command, STCLI-64
* Prefer local/aliased stripes-core for Nightmare tests, STCLI-69
* Include extra modules when generating descriptors for a platform, STCLI-65
* Upgrade to Webpack 4, STCLI-61
* Support running Nightmare tests against an existing instance of FOLIO, STCLI-63
* Update wildcard in workspace template to consider all workspace directories
* Apply a default language to generated tenant config for faster build times, STCOR-232
* Simplify webpack config when testing stripes-components to reduce build time, STCLI-74
* Improve support for running tests against a platform and its apps, STCLI-76
* Check for platform first when generating module descriptors, fixes STCLI-77
* Add `--coverage` option to test nightmare command, STCLI-71 (depends on UITEST-39)
* Support `app create` from within a workspace, STCLI-82


## [1.2.0](https://github.com/folio-org/stripes-cli/tree/v1.2.0) (2018-06-07)

* Exit process when Nightmare tests pass, fixes STCLI-49
* Fix --install typo, STCLI-50
* Updated ui-module inventory
* New `mod` commands to generate descriptors and view tenant modules, STCLI-52
* New `app perms` command to view permissions for an app, STCLI-54
* Support for stdin, added initially to mod enable/disable and perm assign, STCLI-55
* Account for new global Yarn directory on Windows with Yarn >=1.5.1, Fixes STLCI-39
* Add `--coverage` option to test karma command, STCLI-53
* Add junit reporter and headless Chrome to Karma config for CI, STCLI-56
* Add `--strict` option to mod add and descriptor commands, STCLI-59
* Correct get-stdin dependency, fixes STCLI-60
* Use Node 8 to be in line with stripes-core requirement


## [1.1.0](https://github.com/folio-org/stripes-cli/tree/v1.1.0) (2018-04-13)

* Add option to serve an existing build. STCLI-26
* When a config file with modules is provided, do not automatically apply aliases to module config. STCLI-18
* Resolve alias paths relative to `.stripesclirc` config file location. Fixes STCLI-35
* New `platform` commands to create, pull, clean, and install with support for Yarn workspaces: STCLI-23
* Consolidate stripes-core location logic and support for yarn global install. Fixes STCLI-38
* Add ability to use local/aliased stripes-core for build operations, STCLI-27
* Fix issue locating local stripes-core on Windows, STCLI-33
* New CLI user guide and developer guide documents, STCLI-20
* Report unknown commands and enable Yargs recommended commands, fixes STCLI-36
* Disable automatic help display on failure, fixes STCLI-37
* New `perm view` command to view permissions for a user, STCLI-42
* New `okapi token` command to retrieve CLI's stored token, STCLI-43
* Maintain user-supplied module config in app context, STCLI-44
* New `workspace` command, STCLI-41
* Fix issue assigning isGlobalYarn to context, STCLI-45
* Simplify `app create` options, STLCI-46
* Static upgrade message to omit false npm reference, STCLI-34
* Add debug notes and VSCode configuration, STCLI-47


## [1.0.0](https://github.com/folio-org/stripes-cli/tree/v1.0.0) (2018-02-08)

* Add support for passing options to Karma. STCLI-16
* Add permissions to new app templates and ability to push to Okapi. Includes the following: STCLI-7
  * Okapi command to log into an Okapi instance
  * Mod commands to add/remove/update an app's module descriptor in Okapi
  * Mod commands to enable/disable an app module for a tenant in Okapi
  * Perm commands to create and assign app permissions to a user in Okapi
  * Include default module and settings enabled permissions with new app template
  * App create command optionally orchestrates Okapi calls after generating an app
  * Introduce interactive input for some command options
* Improve handling of aliases with added support for stripes-core, STCLI-13
* Apply proper exit code upon test failure. Fixes STCLI-17
* Update webpack config for test with translations plugin. Fixes STCLI-21
* Invoke CLI with `stripes` rather than `stripescli`. STCLI-11
* Update new app templates to use React 16. STCLI-25
* Add translations to new app templates. STCLI-6


## 0.10.0 (2017-12-12 demo)

Versions prior to 1.0.0 available on npm-folioci and include initial support for the following:
* Build and serve commands
* New app command and template
* CLI status command
* Test command for existing Nightmare e2e tests
* Alias support to reduce yarn-linking
* Initial CLI plugin support to define custom options and webpack hook
* Test command support for running unit tests
* Webpack bundle analyzer
* CLI configuration file support
