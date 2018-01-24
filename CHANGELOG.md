# Change history for stripes-cli

## 1.0.0 (IN PROGRESS)
* Add support for passing options to Karma. STCLI-16
* Add permissions to new app templates and ability to push to Okapi. STCLI-7
* Okapi command to log into an Okapi instance
* Mod commands to add/remove/update an app's module descriptor in Okapi
* Mod commands to enable/disable an app module for a tenant in Okapi
* Perm commands to create and assign app permissions to a user in Okapi
* Include default module and settings enabled permissions with new app template
* App create command optionally orchestrates Okapi calls after generating an app
* Introduce interactive input for some command options
* Improve handling of aliases with added support for stripes-core, STCLI-13


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
