# <%= uiAppName %>

Copyright (C) 2017 The Open Library Foundation

This software is distributed under the terms of the Apache License, Version 2.0. See the file "[LICENSE](LICENSE)"  for more information.

## Introduction

Congratulations on creating a new Stripes UI app module!  Follow the instructions below to run <%= uiAppName %> and start your development.

## Prerequisites

In order to view and log into the platform being served up, a suitable Okapi backend will need to be running. The [Folio testing-backend](https://app.vagrantup.com/folio/boxes/testing-backend) Vagrant box should work if your app does not yet have its own backend module. 

## Run your new app

Run the following from the <%= uiAppName %> directory to serve your new app using a development server:
```
stripescli serve
```

Note: When serving up a newly created app that does not have its own backend permissions established, pass the `--hasAllPerms` option to display the app in the UI navigation. For example:
```
stripescli serve --hasAllPerms
```

To specify your own tenant ID or to use an Okapi instance other than http://localhost:9130, pass the `--okapi` and `--tenant` options.
```
stripescli serve --okapi http://my-okapi.example.com:9130 --tenant my-tenant-id
```

## Run the tests

Run the included UI test `demo` with the following command:
```
stripescli test --run demo --show
```

## What to do next?

Now that your new app is running, search the code for "`stripes-new-app`" to find comments and subbed placeholders that may need your attention.

Read the [Stripes Module Developer's Guide](https://github.com/folio-org/stripes-core/blob/master/doc/dev-guide.md).

Update this README with information about your app.
