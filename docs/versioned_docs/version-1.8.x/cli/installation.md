---
id: installation
title: Installation
---

There are several ways to install the `bzl` cli:

## Direct

Use `curl --remote-header-name --location --output https://get.bzl.io/GOOS_GOARCH/VERSION/bzl`.  Without `VERSION` specifier, the latest release is selected.

Once downloaded, you'll have to `chmod +x bzl` before executing it.  

:::note
The CLI does **not** perform telemetry or tracking.
:::

### Linux

```sh
curl -JLO https://get.bzl.io/linux_amd64/bzl
```

### Mac

```sh
curl -JLO https://get.bzl.io/darwin_amd64/bzl
```

### Windows

```sh
curl -JLO https://get.bzl.io/windows_amd64/bzl.exe
```

:::note
(yes, it actually works on windows!)
:::

## Installer Script

See [Authentication](../vscode/authentication) for instruction in register/login.

Registered users are provided with an [installer script](https://bzl.io/@) that
will put the binary in a canonical location `.bzl/bin/bzl` in conjunction with
the `license.key`.

![image](https://user-images.githubusercontent.com/50580/144547684-9f7cdfd2-57a2-420b-934e-befb34184b09.png)

