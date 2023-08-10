# Directus Docker Images

Alternative container image for Directus.

> `linefusion/directus:latest`

## Usage

This image is meant to be an "universal" image for Directus. It's not bound to any specific Directus version because it will install Directus in runtime rather than build time. This greatly increases the bootstrap time of the container, but allows quickly running Directus with extensions inside a container.

For production usage it's still recommended to build your own image, but if you can't and/or don't want to, at least make sure to mount the data directory to lower the startup time after the first run.

## Configuration

> The image can be configured using environment variables.

| Name                           | Type/Format                    |     Default |
| ------------------------------ | ------------------------------ | ----------: |
| **DIRECTUS_VERSION**           | NPM range or `latest`          |  `"latest"` |
| **DIRECTUS_BOOTSTRAP_ENABLED** | Boolean. `"true"` or `"false"` |    `"true"` |
| **DIRECTUS_PACKAGES_ENABLED**  | Boolean. `"true"` or `"false"` |    `"true"` |
| **NODE_PACKAGES**              | String or Object.              | `undefined` |

### `DIRECTUS_VERSION`

| Value                 |    Default |
| --------------------- | ---------: |
| NPM range or `latest` | `"latest"` |

The Directus version to use.

### `DIRECTUS_BOOTSTRAP_ENABLED`

| Value                          |  Default |
| ------------------------------ | -------: |
| Boolean. `"true"` or `"false"` | `"true"` |

Turning this off (`false`) increases startup time but won't migrate your database if you are running a newer version on an older database.

> Note that this is **enabled** by default in the **official** Directus image.

### `DIRECTUS_PACKAGES_ENABLED`

| Value                          |  Default |
| ------------------------------ | -------: |
| Boolean. `"true"` or `"false"` | `"true"` |

Whether to install all the defined `optionalDependencies` from `@directus/api` package, which includes database drivers and storage access.

> Note that this is **enabled** by default in the **official** Directus image.

### `NODE_PACKAGES`

| Value                        | Default |
| ---------------------------- | ------: |
| List of packages to install. |    `""` |

This can be used to install additional packages. It can be a string or a JSON object. If it's a string, you must separate each package with `,` and each package can contain the specific version you want to install. If the version isn't specified, it will use `latest` instead.

If it's a JSON object, it follows the same format as the `package.json` dependencies file format.

#### Examples

```sh
NODE_PACKAGES='my-dependency,my-dependency2@^4.2.3'
```

```sh
NODE_PACKAGES='{"my-dependency":"latest","my-dependency2":"^4.2.3"}'
```
