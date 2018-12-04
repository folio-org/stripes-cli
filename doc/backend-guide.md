# Stripes CLI Back-end Guide

Stripes CLI offers many commands for interacting with Okapi to manage back-end modules for a tenant.  This guide steps through the process of standing up a back-end to support a unique platform.

> Note: This document is currently a work in progress. Notably, it depends on a Vagrant VM that is not yet published.

* [Prerequisites](#prerequisites)
    * [Create a Vagrant box](#create-a-vagrant-box)
    * [Install a front-end platform](#install-a-front-end-platform)
    * [Configure the CLI (optional)](#configure-the-cli-optional)
* [Set up back-end modules](#set-up-back-end-modules)
    * [Useful variants](#useful-variants)
* [Set up back-end modules (multi-step)](#set-up-back-end-modules-multi-step)
    * [Pull modules](#pull-modules)
    * [Generate front-end module ids](#generate-front-end-module-ids)
    * [Include additional dependencies](#include-additional-dependencies)
    * [Perform a dry run](#perform-a-dry-run)
    * [Perform the back-end deployment](#perform-the-back-end-deployment)
    * [Post the front-end module descriptors](#post-the-front-end-module-descriptors)


## Prerequisites

### Create a Vagrant box

This guide requires the (TODO: new box name) Vagrant box or equivalent.  This VM comes pre-loaded with modules to run [platform-core](https://github.com/folio-org/platform-core) modules.  

TODO: replace TBD with actual VM name
```
$ mkdir TBD
$ cd TBD
$ vagrant init folio/TBD
$ vagrant up
```

See the Stripes development setup guide for information to [update an existing Vagrant box](https://github.com/folio-org/stripes/blob/master/doc/new-development-setup.md#update-your-vagrant-box).


### Install a front-end platform

Start by cloning your desired platform, such as [platform-erm](https://github.com/folio-org/platform-erm).

```
$ git clone https://github.com/folio-org/platform-erm
$ cd platform-erm
$ yarn install
```

### Configure the CLI (optional)

Optionally, create a `.stripesclirc` [configuration file](https://github.com/folio-org/stripes-cli/blob/master/doc/user-guide.md#configuration) to store an Okapi URL and tenant ID. Place your CLI configuration in your platform directory or above.

```
{
  "okapi": "http://localhost:9130",
  "tenant": "diku"
}
```

> Tip: Alternatively, [environment variables](https://github.com/folio-org/stripes-cli/blob/master/doc/user-guide.md#environment-variables) can be used.

This step is not required.  It is only a convenience so we don't have to include `--okapi` and `--tenant` options with every command.  For simplicity, the commands in this guide will assume these values are present in a config.  Please remember to provide `--okapi` and `--tenant` on the command line if you choose to skip this step.

> Note: While okapi and tenant values are also present in the tenant config, the CLI commands don't yet consider the tenant config for its Okapi operations (only for build operations). STCLI-117 will address this to avoid the interim duplication.


## Set up back-end modules

The following command, run from within your platform directory, will prepare and deploy modules and their dependencies for your tenant via Okapi's `/_/proxy/tenants/{tenant_id}/install` endpoint.

```
$ stripes platform backend stripes.config.js --user diku_admin --remote http://folio-registry.aws.indexdata.com
```

When running this command, the following operations are performed by the CLI and Okapi:
- Given a `--remote <url>` (optional), Okapi's module descriptors are first updated with the latest from the remote registry.
- Generate module descriptor ids with the tenant config `stripes.config.js` and the yarn installed front-end modules
- Append those ids with additional known dependencies.  For example, `mod-codex-inventory` is included if the platform includes `folio_search` and `folio_inventory`.
- Perform a dry-run install and reports a summary
- Deploy and enable the back-end modules
- Post the front-end modules descriptors
- Given a `--user <username>`, assign missing module permissions to the user

### Useful variants

Bypass updating module descriptors from a remote registry by omitting `--remote`.
```
$ stripes platform backend stripes.config.js
```

Conclude the operation with the dry-run simulation by adding, `--simulate`.  Optionally add `--detail` to view the Okapi response.
```
$ stripes platform backend stripes.config.js --simulate --detail
```

Include additional modules with `--inlcude` and supply a space-separated list of module ids.
```
$ stripes platform backend stripes.config.js --include mod-x mod-y
```


## Set up back-end modules (multi-step)

For more granular control or to better observe the intermediate operations above, the following individual commands can be performed to achieve the same result.

### Pull modules
Your Vagrant box will only have module descriptors available for the modules that it came pre-built with.  The `mod pull` command will instruct Okapi to download the latest module descriptor ids from a remote registry.

```
$ stripes mod pull --remote http://folio-registry.aws.indexdata.com
```
 
### Generate front-end module ids

This will take the tenant config, `stripes.config.js` and convert the selected modules into module descriptor ids.  Additional front-end `stripes-*` modules will be included like `stripes-core`.
```
$ stripes mod descriptor stripes.config.js > my-module-ids
```

### Include additional dependencies

While `stripes platform backend` offers some logic to dynamically append a few module ids that are not otherwise required by a front-end platform, the CLI doesn't currently offer a stand-alone command to do the same.  Manually add any module ids that you know you need, but are not pulled as a dependency of other modules.  Simply edit the prior output file to append the desired ids.

```
$ cat >> my-module-ids << 'EOF'
mod-codex-inventory
mod-x
mod-y
EOF
```

### Perform a dry run

Using the `my-module-ids` file from the prior command as input, pipe the list to `stripes mod install` with the `--simulate` option set.  This will call Okapi to generate a list of the necessary dependencies and their actions, such as enabling or upgrading, needed.  Save this output to a file as it will be used in the next steps.

```
$ cat my-module-ids | stripes mod install --simulate > my-module-actions
```

### Perform the back-end deployment

Using the output from the `--simulate` dry run, filter the results for back-end modules.  For this you can pipe your output through the `stripes mod filter` command. Then pass the filtered results onto `stripes mod install` with the `--deploy` option.

```
$ cat my-module-actions | stripes mod filter --back | stripes mod install --deploy
```


### Post the front-end module descriptors

Using the same output from the dry run, this time filter the results for front-end modules only. Pass the results to `stripes mod install` (without `--deploy`) enable them for the tenant.

```
$ cat my-module-actions | stripes mod filter --front | stripes mod install
```

### Assign permissions to a user

In order to make use of the newly installed modules for development, assign module permissions to a user.  This can be done by chaining a few `stripes` commands together.  The following will gather permissions for all of the tenant's modules, and attempt to assign them to the user.

```
$ stripes mod list | stripes mod perms | stripes perm assign --user diku_admin
```
