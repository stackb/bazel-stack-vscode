---
id: invocations
title: Invocations
---

The Invocations component manages how `build` and `test` codelens actions are
performed, and provides access to revent invocations.

## Configuration

![image](https://user-images.githubusercontent.com/50580/144542715-ec4ba7eb-3018-4833-b400-e6013f25ac8c.png)

Use the settings to configure:

- `invokeWithBuildEventStreaming`: whether to launch `build` and `test`
  invocations in an integrated terminal or via the gRPC streaming API (see
  below).
- `buildEventPublishAllActions`: if enabled with
  `invokeWithBuildEventStreaming`, sets the `--build_event_publish_all_actions`
  flag.
- `hideOutputPanelOnSuccess`: if true, a `build` invocation will open a terminal
  output window while running.  If the operation succeeds, the window is
  automatically closed.

## Usage

Clicking on a [build codelens action link](starlark-language-server#codelens) operates in one of two modes:

1. In the default mode, an integrated terminal is launched that calls `bazel build //:gazelle-protobuf`:

  ![image](https://user-images.githubusercontent.com/50580/144543656-4cc9846a-d7ff-4488-abec-2912d080c5ff.png)

1. In streaming mode, no integrated terminal is launched; the command is run
   directly via bazel's gRPC command API, and the build events are streamed back
   into vscode:

  ![image](https://user-images.githubusercontent.com/50580/144543967-f2314865-61f4-4480-9621-d2a02c83ddd8.png)

Note the build events in the tree view on the left: A select subset of
"interesting" events are surfaced here.

:::tip

The last build/test command is saved in your workspace; invoking the
`bsv.bzl.redo` command (mac: `shift+⌘+space`) allow you to quickly "slap" the
last command; use it to rapidly iterate on build/test.

:::

You can also use the **Recent Invocations** tree item to "replay" recent
invocations, or visit the build results UI for that item.

![image](https://user-images.githubusercontent.com/50580/144544439-03cf2c49-2258-4f2d-a0d0-2fafc331f485.png)

:::caution

Streaming mode bypasses the typical bazel C++ frontend completely and performs
independent parsing of your `.bazelrc` files.  In certain cases, this can lead
to slight differences in the options passed to the bazel server.  If you have
complex bazelrc files, it might cause "thrash" (incrementality degradation)
switching back and forth form the command line and VSCode.

:::
