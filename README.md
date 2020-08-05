# bazel-stack-vscode

Bazel Support for Visual Studio Code.

<table><tr>
<td style="width: 120px; text-align: center"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Bazel_logo.svg/240px-Bazel_logo.svg.png" height="120"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/50580/78734740-486ba400-7906-11ea-89fa-f207544de185.png" height="100"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/29654835/27530004-e789a11e-5a13-11e7-8a34-870da7e678ac.PNG" height="90"/></td>
</tr><tr>
<td style="text-align: center">Bazel</td>
<td style="text-align: center">Stack</td>
<td style="text-align: center">VSCode</td>
</tr></table>

## Features:

- `bazel` and `starlark` files (`BUILD`, `.bazel`, `WORKSPACE`, `*.bzl`, `.star`, `*.sky`):
  - syntax highlighting
  - [formatting & linting diagnostics](#BUILD-file-formatting) (via `buildifier`)
  - hover to get links to bazel documentation
  - hover to get bazel rule & starlark function reference (via experimental Starlark Language
    Server)

- `bazelrc` files (`*.bazelrc`):
  - syntax highlighting
  - hover to get flag reference & links to bazel docs / bazel codesearch
  - completion for all 834 available flags by command (includes undocumented flags).
- `launch.bazelrc` file (a file where you can stash frequently executed commands):
  - syntax highlighting
  - hover over command name to get a "codelens" (click to run the command)
  - repeat previous command for iterative development (`shift+ctrl+space`)
  - custom problem matcher for rules_go output

### BUILD file formatting

![formatting-2560-big](https://user-images.githubusercontent.com/50580/89366582-610d8000-d694-11ea-8cce-de47e11c44db.gif)

![linting-2](https://user-images.githubusercontent.com/50580/89367574-a468ee00-d696-11ea-87bd-45abedd37541.gif)

![lint-4](https://user-images.githubusercontent.com/50580/89368296-6967ba00-d698-11ea-8ea5-d6e4221eda5c.gif)




## Requirements

Portions of this plugin may rely on the [bzl tool](https://build.bzl.io).  You
can install & use the plugin without Bzl but some features will not be
available.


## Known Issues

**Github Rate Limits**: This extension makes requests to the github v3 API.  If
you experience errors due to rate limits, `export
GITHUB_TOKEN={MY_PERSONAL_TOKEN}` and relaunch vscode  to get higher rate
limits.

> NOTE: portions of this extension were adapted from
> https://github.com/bazelbuild/vscode-bazel (Apache 2.0).