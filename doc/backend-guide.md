# Stripes CLI Back-end Guide

Stripes CLI offers many commands for interacting with Okapi to manage back-end modules for a tenant on a Vagrant VM.  This guide steps through the process of standing up a back-end to support a unique front-end platform.

* [Prerequisites](#prerequisites)
    * [1. Create a Vagrant box](#1-create-a-vagrant-box)
    * [2. Install a front-end platform](#2-install-a-front-end-platform)
    * [3. Configure the CLI (optional)](#3-configure-the-cli-optional)
* [Set up back-end modules for your platform](#set-up-back-end-modules-for-your-platform)
    * [1. Set up back-end in one command](#1-set-up-back-end-in-one-command)
    * [Useful variants](#useful-variants)
* [Set up back-end modules for your platform (multi-step)](#set-up-back-end-modules-for-your-platform-multi-step)
    * [1. Pull modules](#1-pull-modules)
    * [2. Generate front-end module ids](#2-generate-front-end-module-ids)
    * [3. Include additional dependencies](#3-include-additional-dependencies)
    * [4. Perform a dry run](#4-perform-a-dry-run)
    * [5. Perform the back-end deployment](#5-perform-the-back-end-deployment)
    * [6. Post the front-end module descriptors](#6-post-the-front-end-module-descriptors)
    * [7. Assign permissions to a user](#7-assign-permissions-to-a-user)
* [Connect a local back-end module to an existing platform](#connect-a-local-back-end-module-to-an-existing-platform)
    * [1. Prerequisites](#1-prerequisites)
    * [2. Post your backend module descriptor](#2-post-your-backend-module-descriptor)
    * [3. Register your local running instance with Okapi](#3-register-your-local-running-instance-with-okapi)
    * [4. Enable your module for the tenant](#4-enable-your-module-for-the-tenant)


## Prerequisites

### 1. Create a Vagrant box

This guide requires [folio/snapshot-backend-core](https://app.vagrantup.com/folio/boxes/snapshot-backend-core), [folio/snapshot-core](https://app.vagrantup.com/folio/boxes/snapshot-core), [folio/minimal](https://issues.folio.org/browse/FOLIO-1730), or equivalent Vagrant box.  The "core" VMs come pre-loaded with modules to run [platform-core](https://github.com/folio-org/platform-core) modules.

```
$ mkdir snapshot-backend-core
$ cd snapshot-backend-core
$ vagrant init folio/snapshot-backend-core
$ vagrant up
```

See the Stripes development setup guide for information to [update an existing Vagrant box](https://github.com/folio-org/stripes/blob/master/doc/new-development-setup.md#update-your-vagrant-box).


### 2. Install a front-end platform

Start by cloning your desired platform, such as [platform-erm](https://github.com/folio-org/platform-erm).

```
$ git clone https://github.com/folio-org/platform-erm
$ cd platform-erm
$ yarn install
```

### 3. Configure the CLI (optional)

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


## Set up back-end modules for your platform

The CLI attempts to simplify the back-end setup process by automating many steps with one command.  This command assumes your platform's front-end (`folio_*`) and back-end modules have published descriptors available to pull from the remote registry.  If your front-end ui-module descriptors have not yet been published, you can add add them to your VM with the CLI's [mod add](./commands.md#mod-add-command).

```
$ stripes mod add --strict
```

### 1. Set up back-end in one command

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


## Set up back-end modules for your platform (multi-step)

For more granular control or to better observe the intermediate operations above, the following individual commands can be performed to achieve the same result.

### 1. Pull modules
Your Vagrant box will only have module descriptors available for the modules that it came pre-built with.  The `mod pull` command will instruct Okapi to download the latest module descriptor ids from a remote registry.

```
$ stripes mod pull --remote http://folio-registry.aws.indexdata.com
```
 
### 2. Generate front-end module ids

This will take the tenant config, `stripes.config.js` and convert the selected modules into module descriptor ids.  Additional front-end `stripes-*` modules will be included like `stripes-core`.
```
$ stripes mod descriptor stripes.config.js > my-module-ids
```

### 3. Include additional dependencies

While `stripes platform backend` offers some logic to dynamically append a few module ids that are not otherwise required by a front-end platform, the CLI doesn't currently offer a stand-alone command to do the same.  Manually add any module ids that you know you need, but are not pulled as a dependency of other modules.  Simply edit the prior output file to append the desired ids.

```
$ cat >> my-module-ids << 'EOF'
mod-codex-inventory
mod-x
mod-y
EOF
```

### 4. Perform a dry run

Using the `my-module-ids` file from the prior command as input, pipe the list to `stripes mod install` with the `--simulate` option set.  This will call Okapi to generate a list of the necessary dependencies and their actions, such as enabling or upgrading, needed.  Save this output to a file as it will be used in the next steps.

```
$ cat my-module-ids | stripes mod install --simulate > my-module-actions
```

### 5. Perform the back-end deployment

Using the output from the `--simulate` dry run, filter the results for back-end modules.  For this you can pipe your output through the `stripes mod filter` command. Then pass the filtered results onto `stripes mod install` with the `--deploy` option.

```
$ cat my-module-actions | stripes mod filter --back | stripes mod install --deploy
```


### 6. Post the front-end module descriptors

Using the same output from the dry run, this time filter the results for front-end modules only. Pass the results to `stripes mod install` (without `--deploy`) enable them for the tenant.

```
$ cat my-module-actions | stripes mod filter --front | stripes mod install
```

### 7. Assign permissions to a user

In order to make use of the newly installed modules for development, assign module permissions to a user.  This can be done by chaining a few `stripes` commands together.  The following will gather permissions for all of the tenant's modules, and attempt to assign them to the user.

```
$ stripes mod list | stripes mod perms | stripes perm assign --user diku_admin
```

## Connect a local back-end module to an existing platform

The following describes how to incorporate a local development instance of a backend module with an existing Okapi using `stripes` CLI commands.

### 1. Prerequisites

* Create and run the [folio/snapshot-core](#create-a-vagrant-box) vagrant box
* Build and host your local back-end module following its instructions ([example](https://github.com/folio-org/raml-module-builder#get-started-with-a-sample-working-module)).

Commands below assume `--okapi` and `--tenant` values have been set via [configuration](#configure-the-cli-optional).  Please include these options with your commands if not previously set.


### 2. Post your backend module descriptor

From your back-end module's directory, post its module descriptor with the `mod add` command.  It is important to run this command after an install/build since the module descriptor found within the `/target` directory will be used. 

```
$ stripes mod add
```

### 3. Register your local running instance with Okapi

From the back-end module's directory, use the `mod discover` command register your locally running module instance. Provide the port where it is hosted locally.

```
$ stripes mod discover --port 8080
```

Variations of this command can be useful. For example, to see existing instances, run the command with no options.  To clear out all existing instances, use the `--forget` option.  See [mod discover](./commands.md#mod-discover-command-work-in-progress) in the command reference for more information.


### 4. Enable your module for the tenant

For the commands below, `mod descriptor` simply returns the module descriptor id so that we can pipe this into the `mod install` command.

Optionally, review what changes will take place beforehand with `--simulate`.
```
$ stripes mod descriptor | stripes mod install --simulate
```

Enable this module for your tenant with `mod install`.
```
$ stripes mod descriptor | stripes mod install
```
