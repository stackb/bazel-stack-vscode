# bazel-stack-vscode

[Bazel](https://bazel.build) Support for Visual Studio Code.

<table><tr>
<td style="width: 120px; text-align: center"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Bazel_logo.svg/240px-Bazel_logo.svg.png" height="120"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/50580/78734740-486ba400-7906-11ea-89fa-f207544de185.png" height="100"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/29654835/27530004-e789a11e-5a13-11e7-8a34-870da7e678ac.PNG" height="90"/></td>
</tr><tr>
<td style="text-align: center">Bazel</td>
<td style="text-align: center">Stack</td>
<td style="text-align: center">VSCode</td>
</tr></table>

## Documentation

<https://stackb.github.io/bazel-stack-vscode/>

## Marketplace

<https://marketplace.visualstudio.com/items?itemName=StackBuild.bazel-stack-vscode/>

## Basic Features:

- `bazel` and `starlark` files (`BUILD`, `.bazel`, `WORKSPACE`, `*.bzl`, `.star`, `*.sky`):
  - syntax highlighting
  - [formatting](#Build-File-Formatting) & [linting diagnostics](#Build-File-Linting-Diagnostics) (via `buildifier`)
  - hover to get [links to bazel documentation](#Hover-Symbols-to-Get-Documentation-Links)
  - hover to get [bazel rule & starlark function
    reference](#Hover-Symbols-to-Get-Inline-Documentation) (via Starlark
    Language Server)
  - [go to definition](https://stackb.github.io/bazel-stack-vscode/jumping) for bazel labels
  
- `bazelrc` files (`*.bazelrc`):
  - syntax highlighting
  - hover to get [flag reference](#Hover-Flags-to-Get-Inline-Documentation) & links to bazel docs / bazel codesearch
  - completion for all 834 available flags by command (includes undocumented flags).
- `launch.bazelrc` file (a file where you can stash frequently executed commands):
  - syntax highlighting
  - [hover over command name](#Launch-File-Codelens) to get a "codelens" (click to run the command)
  - repeat previous command for iterative development (`shift+ctrl+space`)
  - custom problem matcher for rules_go output

### Build File Formatting

![1-format](https://user-images.githubusercontent.com/50580/89370237-7cc95400-d69d-11ea-8d6c-949fd099cf21.gif)

### Build File Linting Diagnostics

![1-lint](https://user-images.githubusercontent.com/50580/89370514-227cc300-d69e-11ea-8784-266e9756e8ec.gif)

### Go To Definition for Bazel Labels

![jtd-1](https://user-images.githubusercontent.com/50580/97147747-9c699900-172f-11eb-87b8-6142563eaa62.gif)

### Hover Symbols to Get Inline Documentation

![1-rulehover](https://user-images.githubusercontent.com/50580/89370355-c31eb300-d69d-11ea-8fc6-eeff04641dd0.gif)

### Hover Symbols to Get Documentation Links

![1-bazeldoc](https://user-images.githubusercontent.com/50580/89370432-efd2ca80-d69d-11ea-97e3-cdc52925acf9.gif)

### Hover Flags to Get Inline Documentation

![1-flaghover](https://user-images.githubusercontent.com/50580/89370676-8f905880-d69e-11ea-958b-5b7574abd067.gif)

> Includes all 834 flags (including undocumented options)

### Flag Autocomplete

![1-flag-completion](https://user-images.githubusercontent.com/50580/89370594-5ce66000-d69e-11ea-8838-7520efd6531a.gif)

> Use the `' '` (space) or `'='` (equals) to commit choice and continue typing

### Launch File Codelens

![1-launch](https://user-images.githubusercontent.com/50580/89370737-b64e8f00-d69e-11ea-970d-d139fbaab06f.gif)

Keep a `launch.bazelrc` file for common (or uncommonly used) commands.  Click
the "codelens" to
run it.

> Repeat the last command with `shift+ctrl+space`.

> NOTE: the directory where the `launch.bazelrc` file determines the working
> directory for the shell.  Typically you'll put this next to your `WORKSPACE` file.

## Advanced Features:

The advanced features are available with a [Bzl](https://build.bzl.io)
subscription.  Sign-up on the website or within the vscode extension.  Read more
about advanced features on the [documentation
site](https://stackb.github.io/bazel-stack-vscode/).

---

**Github Rate Limits**: This extension makes requests to the github v3 API.  If
you experience errors due to rate limits, `export
GITHUB_TOKEN={MY_PERSONAL_TOKEN}` and relaunch vscode  to get higher rate
limits.

> NOTE: portions of this extension were adapted from
> https://github.com/bazelbuild/vscode-bazel (Apache 2.0).