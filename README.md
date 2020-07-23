# bazel-stack-vscode

Bazel Support for Visual Studio Code.

<table><tr>
<td style="width: 120px; text-align: center"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Bazel_logo.svg/240px-Bazel_logo.svg.png" height="120"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/50580/78734740-486ba400-7906-11ea-89fa-f207544de185.png" height="100"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/29654835/27530004-e789a11e-5a13-11e7-8a34-870da7e678ac.PNG" height="90"/></td>
</tr><tr>
<td style="width: 120px; text-align: center">Bazel</td>
<td style="width: 120px; text-align: center">Stack</td>
<td style="width: 120px; text-align: center">VSCode</td>
</tr></table>

<table border-collapse="collapse" style="margin: 1rem 0">
<tr><td style="border: 1px solid rgba(255,255,255,0.16)">

## Syntax Highlighting

This extension contributes a language grammar for:

1. **bazel** files (`WORKSPACE`, `BUILD`, `*.bazel`, `*.bzl`)
2. plain **starlark** files (`.sky` and `.star`)
3. **bazelrc** files (`bazelrc`, `*.bazelrc`)

![starlark-grammar](https://user-images.githubusercontent.com/50580/87883685-38b03100-c9c6-11ea-88ac-04202a45abaf.png)

![bazelrc-grammar](https://user-images.githubusercontent.com/50580/88016408-8caf3880-cae0-11ea-8afa-a2898f136d2f.png)

</tr></tr>
</table>


## Buildifier Linting/Formatting

This extension contributes:

1. Linting diagnostics for starlark/bazel files
2. Document formatting for starlark/bazel

![buildifier-lint](https://user-images.githubusercontent.com/50580/88228725-ce4cfa00-cc2c-11ea-82a6-3d9a7975d148.gif)

![buildifier-format](https://user-images.githubusercontent.com/50580/88228704-cab97300-cc2c-11ea-9920-54e981c1e8ae.gif)

> By default this extension will automatically download a copy of `buildifier`
for you.  Use the `bzl.buildifier.executable` setting to  explicitly configure a
path to a pre-installed buildifier binary. 

</tr></tr>
</table>


<table border-collapse="collapse" style="margin: 1rem 0">
<tr><td style="border: 1px solid rgba(255,255,255,0.16)">

## Snippets

This extension contributes a set of snippets for assorted bazel/starlark
idioms:

![feature-snippets](https://user-images.githubusercontent.com/50580/87883832-60ec5f80-c9c7-11ea-87a8-ec78e7214670.png)
</tr></tr>
</table>

<table border-collapse="collapse" style="margin: 1rem 0">
<tr><td style="border: 1px solid rgba(255,255,255,0.16)">

## Links to Bazel Documentation

This extension contributes a HoverProvider that looks for built-in symbols in starlark files and provides links to documentation:

![hover-doc-links](https://user-images.githubusercontent.com/50580/87987703-4c2dcb80-ca9c-11ea-95f0-430b1d8856e7.gif)

</tr></tr>
</table>

## Requirements

Portions of this plugin may rely on the [bzl tool](https://build.bzl.io).  You
can install & use the plugin without Bzl but some features will not be
available.

## Extension Settings

None currently.

## Known Issues

**Github Rate Limits**: This extension makes requests to the github v3 API.  If
you experience errors due to rate limits, `export
GITHUB_TOKEN={MY_PERSONAL_TOKEN}` and relaunch vscode  to get higher rate
limits.