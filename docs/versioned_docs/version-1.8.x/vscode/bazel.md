---
id: bazel
title: Bazel
---

The Bazel component provides the bazel info, the ability to terminate the
current bazel server, and access to external workspaces.

## Configuration

![image](https://user-images.githubusercontent.com/50580/144523035-095c3c6a-3cb4-42e2-9555-97c8df70c2d4.png)

The settings here can be customized to provide an alternate location for the
`bazel` executable, as well as `build` and `test` flags when using the [codelens
actions](starlark-language-server#codelens).

## Bazel Info

Click on tree items in the bazel info to copy them to clipboard.

## Killing the Bazel Server

Occasionally, bazel will get stuck on a long-running bazel query, or some other
operation and you might want to force kill it.  

Use the Trash icon over the server_pid entry as an alternative to: `kill -9 $(bazel info server_pid)`:

![image](https://user-images.githubusercontent.com/50580/144523418-1bebe8e8-d7cf-45a5-ade3-4316295290c4.png)

## Navigating to External Workspaces

Click on the **Externals** *browser* button to open the corresponding tab in the UI:

![image](https://user-images.githubusercontent.com/50580/144523706-1d3ad444-309d-4737-a04e-691583e31882.png)

![image](https://user-images.githubusercontent.com/50580/144523680-738dacff-a76a-4a4c-8f12-bf1bda124933.png)

Click on an individual external workspace item to navigate to the `WORKSPACE` location where the external is declared.

Click on the **Root Folder** icon to open a new VSCode window in that workspace:

![image](https://user-images.githubusercontent.com/50580/144525558-1e940afa-b469-408f-8b47-008c065072c6.png)
