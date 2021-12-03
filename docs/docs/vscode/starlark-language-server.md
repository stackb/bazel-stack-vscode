---
id: starlark-language-server
title: Starlark Language Server
---

The Starlark Language Server component provides intellisense features for `BUILD`, `BUILD.bazel`, `WORKSPACE`, `*.bzl` and related files.

A different feature set is provided for `.bazelrc` files.

## Configuration

The language server is configured automatically, no specific configuration is required.  To increase logging level, add `--log_level=info` to the `bsv.bzl.lsp.command` setting.

You can enable/disable various codelens actions via the settings if you find them overly intrusive.

## Codelens

Codelens actions are the little links that appear above rule declarations:

![image](https://user-images.githubusercontent.com/50580/144455265-a5e60a26-179a-46a1-b4e6-f498cc62c4da.png)

- `//example/routeguide:routeguide_proto` the codelens with the full label will
   copy the bazel label to the clipboard.

- `build` will run `bazel build LABEL` in an integrated terminal.
- `test` will run `bazel test LABEL` in an integrated terminal.
- `run` will run `bazel run LABEL` in an integrated terminal.
- `debug` will launch a debug session with `bazel build LABEL --experimental_skylark_debug`.
- `codesearch` will open up the [codesearch](codesearch.md) webview that will
  search within the bazel query defined by `deps(LABEL)`.
- `browse` will open a browser tab in the Bezel UI at the corresponding rule.

## Hover

Hover over any builtin rule/function/provider/attribute to get inline documentation:

![image](https://user-images.githubusercontent.com/50580/144456887-8dc14482-e98e-4caa-bb5d-87c21f2e9f22.png)

Hover over any custom starlark rule to get inline documentation:

:::info
Hover documentation for custom/third-party rules is a subscription feature.
:::

![image](https://user-images.githubusercontent.com/50580/144457202-f6143170-117f-4ba2-b565-0520234c24fb.png)

Hover over flags in a `.bazelrc` file to get flag documentation:

![image](https://user-images.githubusercontent.com/50580/144457787-dc1354e5-76a1-48d9-a68d-510082b79568.png)

Click on the provided link to go to the bazel docs, or perform a codesearch for
the flag in https://cs.opensource.google/bazel/bazel.

## Completion

Type to get autocompletion for builtin rules:

:::info

Autocompletion for custom and third-party starlark rules (ones defined in .bzl
files within your repo, or an external repository) is a subscription feature.

:::

![image](https://user-images.githubusercontent.com/50580/142479223-e1c9161c-ced8-4c2f-a0eb-998e802a5468.gif)

Add attributes at the end of the rule to get autocompletion for rule attributes.


Type `""` in a load statement to get autocompletion of available load symbols:

:::info
Completion for load symbols is a subscription feature.
:::

![image](https://user-images.githubusercontent.com/50580/144459351-6508f9f5-1a1d-41b4-aac7-66c518024d57.png)

Completion for flags is provided within `.bazelrc` files:

![image](https://user-images.githubusercontent.com/50580/144462097-85d8f603-11c8-4a85-a6c8-894572fc84cc.png)

## Definition

Type `F12` in a bazel label (string literal) to jump to the definition of the label:

![lsp-label-jump-to-definition](https://user-images.githubusercontent.com/50580/144460690-53d3f7e7-0e49-40c3-8306-b23cde9e78f2.gif)

`F12` over a rule name to jump the file where the symbol is declared:

:::info
Jump-to-definition for custom/third-party rules is a subscription feature.
:::

![jump-to-rule-definition](https://user-images.githubusercontent.com/50580/144461590-c29d7d18-68e0-471d-a340-7ff7dd81cf3b.gif)

### Jump-to-label

Use the `bsv.bzl.goToLabel` command (mac: `⌘+;`; just below the familiar `⌘+p`
accelerator) to pop open an input box.  Enter the bazel label to navigate to and
press `ENTER`:

![jump-to-label](https://user-images.githubusercontent.com/50580/144545241-0f92f222-a916-491f-9c9b-9a5fe0ae5735.gif)

## Syntax Highlighting

Syntax highlighting is provided for `bazel` and `starlark` files.
