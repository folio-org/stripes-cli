# Stripes CLI Troubleshooting

This page contains troubleshooting suggestions and known issues for the CLI.  Refer to the [stripes troubleshooting guide](https://github.com/folio-org/stripes/blob/master/doc/troubleshooting.md) for general Stripes troubleshooting.

Also refer to the [STCLI project](https://issues.folio.org/browse/STCLI) in the [FOLIO issue tracker](https://dev.folio.org/guidelines/issue-tracker) to review open bugs that may contain relevant notes or workarounds.


## My new Stripes UI app does not show up!

When a newly created app does not show up in the navigation bar, this is likely due to the user not having permission to view the app.  In order to have permission to view the app:
  1. The app's module descriptor must be posted to Okapi
  2. The module must be associated with a tenant
  3. The user must be assigned the app's permission `module.[appName].enabled`

Given you are already [logged into Okapi](./commands.md#okapi-login-command), check to see if the user has permissions to your app.  For example:
```
$ stripes perm list --user diku_admin
```

See [assigning permissions](./user-guide.md#assigning-permissions) if you need to add the module descriptor to Okapi, assign the module to a tenant, or assign module permissions to a user.


## Global install on Windows with Yarn >= 1.5.1 and Stripes CLI <= 1.1.0

> **Note:** This issue was fixed with the release of Stripes CLI `1.2.0`.  If you still experience trouble, please report your issue on Slack and try the original solution below.

Yarn's global install directory changed on Windows with the release of Yarn 1.5.1.  A dependent package used to retrieve the global installation has not been updated to reflect this change.  This causes an issue in which the CLI is unable to locate `stripes-core`.

The problem will surface at build time as a few "Module not found" errors such as the following:
```
ERROR in multi webpack-hot-middleware/client typeface-source-sans-pro @folio/stripes-components/lib/global.css C:/Users/mattjones/AppData/Local/Yarn/Data/global/node_modules/@folio/stripes-core/src/index
Module not found: Error: Can't resolve 'babel-loader' in 'C:\Users\mattjones\projects\folio\ui-users'
```

The interim solution is to include `stripes-core` locally in your platform's dependencies, or in the case of an app, create a workspace which includes stripes-core.

Create workspace with stripes-core:
```
$ stripes workspace
```
From interactive menu, select stripes-core along with any other modules you plan to modify.

## Global install not detected

On some environments, Stripes-CLI is unable to detect a global install. This prevents the CLI from updating the Webpack resolve.modules and resolveLoader.modules paths. As a result, various "Module not found" errors can occur during `build` or `serve`.

> Note: A global CLI install is useful for setting up a workspace or scaffolding a new ui-module. It is otherwise generally advisable to run the CLI as a devDependency of your module or platform.

To verify if your _global_ installation is not detected properly, run `stripes status`.  If you are experiencing issues and the output of your global install is reporting `global cli: false` with this command, please review the workaround mentioned in STCLI-66.
