---
id: usage
title: Usage
---

## Commands

```
Build-Version: v1.3.3
Build-Commit: c877d4fad959bff3c84a1800d345bf4f70f561ba
Build-Date: 2021-12-02

Any command not named in the list is passed directly to bazel  (e.g. 'bzl build //...')

Usage:
  bzl [command]

Available Commands:
  auth        manage credentials for the Bezel Cloud SDK
  cache       start the remote disk cache
  code        Bazel codesearch operations
  debug       Attach to a starlark debug server (EXPERIMENTAL)
  help        Help about any command
  install     Install a version of bazel
  license     Perform license operations
  lsp         Perform languange server protocol operations
  release     Print bzl release version
  serve       Serve the UI
  use         Repository rule generator (defaults to http_archive)

Flags:
  -h, --help   help for bzl

Use "bzl [command] --help" for more information about a command.
```

### Bazelisk-like features

The `bzl` cli works like bazelisk: it recognizes the `USE_BAZEL_VERSION`
environment variable as well as the `.bazelversion` file.

Any command not recognized by the CLI is passed through to bazel itself, so you
can use it as a drop-in replacement for the `bazel` frontend.

:::note

The "bazelisk" features actually predate bazelisk; it's not a copycat.  The
original interpreted the environment variable `BAZEL_VERSION` as well as the
file `.bazelversion`.  This (and the filesystem layout for storing artifacts)
was later changed to `USE_BAZEL_VERSION` to be bazelisk-compatible.

:::

## Common Flags

```sh
      --base_dir string                       base directory where bzl caches data (defaults to {USER_CACHE_DIR}/bzl)
      --base_url string                       base URL where the HTTP service is running (optional, used for link generation)
      --license_file string                   path to license.key (overrides canonical location ~/.bzl/license.key)
      --license_token string                  license token (content of the license file
      --log_level string                      optional log-level (debug|info|warn|trace) (default "info")
```

## Configuration File

The `bzl` tool borrows the `bazelrc` format used by bazel.

The user `$HOME/.bzlrc` file is parsed on startup.

For example, you can change the bind port by adding the following to your
`$HOME/.bzlrc` file:

```rc
serve --address=localhost:8085
```