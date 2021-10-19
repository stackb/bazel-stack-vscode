---
layout: default
title: Launching
permalink: /launching
nav_order: 8
---

## Launching

<p></p>

The `bazel-stack-vscode` extension recognizes the file `launch.bazelrc` in the
root of the workspace as a special file wherein each line in the file is
interpreted as a single command.

Completion for bazel flags is available as you type:

![1-flag-completion](https://user-images.githubusercontent.com/50580/89370594-5ce66000-d69e-11ea-8838-7520efd6531a.gif)

> Use the `' '` (space) or `'='` (equals) to commit choice and continue typing

Flag help is available as a hover:

![1-flaghover](https://user-images.githubusercontent.com/50580/89370676-8f905880-d69e-11ea-958b-5b7574abd067.gif)

The `launch.bazelrc` file also acts as a *codelens* that allows you to  `build`, `test`, `run`, ....:

![1-launch](https://user-images.githubusercontent.com/50580/89370737-b64e8f00-d69e-11ea-970d-d139fbaab06f.gif)

> Repeat the last command with `shift+ctrl+space`.

Finally, the `launch.bazelrc` file also pre-populates the *Recent Commands* view.