# bazel-stack-vscode

Bazel Support for Visual Studio Code.

<table><tr>
<td><img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Bazel_logo.svg/240px-Bazel_logo.svg.png" height="120"/></td>
<td><img src="https://user-images.githubusercontent.com/50580/78734740-486ba400-7906-11ea-89fa-f207544de185.png" height="100"/></td>
<td><img src="https://user-images.githubusercontent.com/29654835/27530004-e789a11e-5a13-11e7-8a34-870da7e678ac.PNG" height="100"/></td>
</tr><tr>
<td>Bazel</td>
<td>Stack</td>
<td>VSCode</td>
</tr></table>

## Features

<table border-collapse="collapse">
<tr><td style="border: 1px solid rgba(255,255,255,0.08)">

### Syntax Highlighting for Starlark Files

This extension contributes a language grammar for Starlark files:

![feature-syntax](https://user-images.githubusercontent.com/50580/87883685-38b03100-c9c6-11ea-88ac-04202a45abaf.png)

Look for the language "Starlark" selected when opening `BUILD.bazel`, `BUILD`, `*.bzl`, `WORKSPACE`, and `WORKSPACE.bazel` file:

<img width="340" alt="Screen Shot 2020-07-19 at 1 57 04 PM" src="https://user-images.githubusercontent.com/50580/87883899-d35d3f80-c9c7-11ea-8e6f-02e370214c40.png">

</tr></tr>

<tr><td style="border: 1px solid rgba(255,255,255,0.08)">

### Snippets for common starlark idioms

This extension contributes a set of snippets for starlark files:

![feature-snippets](https://user-images.githubusercontent.com/50580/87883832-60ec5f80-c9c7-11ea-87a8-ec78e7214670.png)
</tr></tr>

<tr><td style="border: 1px solid rgba(255,255,255,0.08)">

### Hover to Bazel Documentation Links

This extension contributes a HoverProvider that looks for built-in symbols in starlark files and provides links to documentation:

![hover-doc-links](https://user-images.githubusercontent.com/50580/87987703-4c2dcb80-ca9c-11ea-95f0-430b1d8856e7.gif)

</tr></tr>

</table>

## Requirements

Portions of this plugin rely on the [bzl tool](https://build.bzl.io).  You can
install & use the plugin without Bzl but some features will not be available.

## Extension Settings

None currently.

## Known Issues

N/A

## Release Notes

### 0.2.0

Add hover provider for built-in symbols bazel documentation.

### 0.1.0

Initial release.
