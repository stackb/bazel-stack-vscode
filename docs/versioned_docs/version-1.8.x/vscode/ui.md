---
id: ui
title: Bezel UI
---

The UI component displays provides links to the Bezel UI.

:::tip
By default, the UI is available at <http://localhost:8085>
:::

## Configuration

![image](https://user-images.githubusercontent.com/50580/144528317-62188f65-ea9a-4fb6-b428-240e42360912.png)

The settings allow customization of the server address, and other startup
options.  For example, to change the server listen port to `9094`, change the **workspace**
`bsv.bzl.server.address` settings to `grpc://localhost:9094`.

:::note

If you have multiple VSCode windows running (each with it's own extension host
and potentially multiple instances of the bazel-stack-vscode extension), only
one will be serving the UI at any given time.  When the UI component starts up,
it checks if an existing server is running at the given address: if it can
connect, and another server will not be launched.

:::

- Use the **Workspace browser** tree item to open a browser tab with the
  workspace explorer.
- Use the **Package browser** tree item to open a browser tab with the (default
  workspace) package explorer.
- Use the **Flag browser** tree item to open a browser tab with the flag
  explorer.
