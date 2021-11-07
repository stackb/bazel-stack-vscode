---
layout: default
title: Formatting
permalink: /formatting
nav_order: 4
---

## Formatting

<p></p>

`BUILD` file formatting is performed by the `buildifier` tool:

![1-format](https://user-images.githubusercontent.com/50580/89370237-7cc95400-d69d-11ea-8d6c-949fd099cf21.gif)

To configure the version of `buildifier` that will be downloaded, configure the
settings under `bsv.buildifier.*`.

To format BUILD files on every save, add the following to your settings.json `> Preferences: Open Settings (JSON)`:

```json
"[bazel]": {
    "editor.formatOnSave": true
}
```

## Build File Editing/Rewriting

The
[buildozer](https://github.com/bazelbuild/buildtools/blob/4a3d3f3ff787e3fb7a92d7cceba09c7fe4b71ce4/buildozer/README.md)
command is included.

Despite buildozer's usefulness (when you need it), it can be challenging to
remember the command syntax.  A "wizard" command is available
(`shift+ctrl+cmd+p` or `bsv.buildozer.wizard`) that can help you construct a
buildozer command.  This will prompt you though the various command arguments,
and run the command in a terminal.

Once you have built an initial buildozer command, it will likely be easier to
simply iterate on it within the terminal itself, rather than re-running the
wizard.

<img width="1193" alt="Screen Shot 2021-11-07 at 10 16 38 AM" src="https://user-images.githubusercontent.com/50580/140654870-fd2fcba3-0a2a-4537-a32b-cf1d59defd00.png">