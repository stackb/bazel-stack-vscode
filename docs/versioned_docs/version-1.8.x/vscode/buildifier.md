---
id: buildifier
title: Buildifier
---

The Buildifier component manages formatting and linting of `BUILD` files.

## Configuration

Buildifier is downloaded automatically; no specific configuration is required.

Format-on-save for BUILD files is *highly recommended*.  Put the following in your `settings.json`:

```json
    "[bazel]": {
        "editor.formatOnSave": true
    },
```

Additional configuration such as the version of `buildifier` to download are available under the `Settings` tree item:

![image](https://user-images.githubusercontent.com/50580/144353469-bc903a58-e4d1-42f7-9168-29630d7409f5.png)
