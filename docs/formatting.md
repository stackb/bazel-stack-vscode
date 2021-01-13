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
