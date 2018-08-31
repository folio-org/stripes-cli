# Change history for stripes-cli

## [1.4.0] (IN PROGRESS)
* Switched from `karma-coverage` to `karma-coverage-istanbul-reporter`
* Resolve issue causing nightmare command to throw an error even when tests pass, fixes STCLI-86
* STCLI-88 resolved. Resolved an issue where command test nightmare would not return process error when failing
* Enable shell when spawning child process on Windows, fixes STCLI-89
* Replace `ui-testing#framework-only` with `stripes-testing`, STCLI-92


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
