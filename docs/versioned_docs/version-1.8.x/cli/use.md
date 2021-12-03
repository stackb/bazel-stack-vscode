---
id: use
title: subcommand 'use'
---

The `use` subcommand is a repository rule generator.  The tool will download the
dependency, compute a sha256, and format a repository rule.

```sh
$ bzl use --help
Repository rule generator (defaults to http_archive)

Usage:
  bzl use [OWNER][/NAME] [REF] [flags]
  bzl use [command]

Available Commands:
  git_repository generate git_repository repository rule
  go_repository  generate go_repository repository rule
  http_archive   generate an http_archive repository rule
  http_file      generate an http_file/http_jar repository rule

Flags:
  -h, --help   help for use

Use "bzl use [command] --help" for more information about a command.
```

## Examples

:::note
In this first case, the prefix `github.com/bazelbuild` was implied
:::

```
$ bzl use archive rules_proto
```

```python
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

# Branch: master
# Commit: 11bf7c25e666dd7ddacbcd4d4c4a9de7a25175f8
# Date: 2021-11-16 11:07:13 +0000 UTC
# URL: https://github.com/bazelbuild/rules_proto/commit/11bf7c25e666dd7ddacbcd4d4c4a9de7a25175f8
#
# Update protobuf to 3.19.1 (#108)
#
# * Update protobuf to 3.19.1
#
# * Update precompiled protoc binaries
# Size: 14304 (14 kB)
http_archive(
    name = "rules_proto",
    sha256 = "20b240eba17a36be4b0b22635aca63053913d5c1ee36e16be36499d167a2f533",
    strip_prefix = "rules_proto-11bf7c25e666dd7ddacbcd4d4c4a9de7a25175f8",
    urls = ["https://github.com/bazelbuild/rules_proto/archive/11bf7c25e666dd7ddacbcd4d4c4a9de7a25175f8.tar.gz"],
)
```

To use a specific commit (this time from a non-bazelbuild github organization):

```sh
bzl use go stackb/rules_proto ed8aa4f9b7f3f295b27c8c8827c8bf96bb57f419
```

```python

load("@bazel_gazelle//:deps.bzl", "go_repository")

# Commit: ed8aa4f9b7f3f295b27c8c8827c8bf96bb57f419
# Date: 2021-11-17 17:18:31 +0000 UTC
# URL: https://github.com/stackb/rules_proto/commit/ed8aa4f9b7f3f295b27c8c8827c8bf96bb57f419
#
# Update build status badge
# Size: 885660 (886 kB)
go_repository(
    name = "build_stack_rules_proto",
    importpath = "github.com/stackb/rules_proto",
    commit = "ed8aa4f9b7f3f295b27c8c8827c8bf96bb57f419",
)
```

To use a file:

```sh
bzl use file https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/build.css
```

```python
load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_file")

# HTTP/2.0 200 OK
# Date: Fri, 03 Dec 2021 05:09:54 GMT
# Expires: Wed, 23 Nov 2022 05:09:54 GMT
# Last-Modified: Mon, 04 May 2020 16:13:32 GMT
# Size: 88 (88 B)
http_file(
    name = "cdnjs_cloudflare_com_ajax_libs_octicons_8_5_0_build_css",
    sha256 = "88f5210a1c2eacb442ac308cd7ed9ad8b0def697d6e897b6f68fe803954faf6f",
    urls = ["https://cdnjs.cloudflare.com/ajax/libs/octicons/8.5.0/build.css"],
)
```