# Stripes CLI Troubleshooting

This page contains troubleshooting suggestions and known issues for the CLI.  Refer to [stripes-core's troubleshooting guide](https://github.com/folio-org/stripes-core/blob/master/doc/troubleshooting.md) for more.

## Global install on Windows with Yarn 1.5.1

Yarn's global install directory changed on Windows with the release of Yarn 1.5.1.  A dependent package used to retrieve the global installation has not been updated to reflect this change.  This causes an issue in which the CLI is unable to locate `stripes-core`.

The problem will surface at build time as a few "Module not found" errors such as the following:
```
ERROR in multi webpack-hot-middleware/client typeface-source-sans-pro @folio/stripes-components/lib/global.css C:/Users/mattjones/AppData/Local/Yarn/Data/global/node_modules/@folio/stripes-core/src/index
Module not found: Error: Can't resolve 'babel-loader' in 'C:\Users\mattjones\projects\folio\ui-users'
```

The interim solution is to include `stripes-core` locally in your platform's dependencies, or in the case of an app, create an alias to clone of stripes-core.

Install stripes-core:
```
git clone https://github.com/folio-org/stripes-core.git
cd stripes-core
yarn install
```

Create an alias:
```
stripes alias add @folio/stripes-core ..path/to/stripes-core
```

Alternativly, update your `.stripesclirc` configuration:
```
{
  "aliases": {
    "@folio/stripes-core": "..path/to/stripes-core"
  }
}
```
