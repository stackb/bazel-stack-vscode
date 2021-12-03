---
id: remote-cache
title: Remote Cache
---

The Remote Cache component allows you to run a cache on your local workstation.

You might be thinking: *Why would I want a remote cache running locally?  Isn't
this something that's only used in CI?*

It turns out that having a remote cache instance running locally is useful for
overall build speedups when dealing with multiple bazel repositories, or when
switching back and forth between branches.  It's also typically faster than
`--disk_cache` for unclear reasons, and manages its own disk space better.

:::tip

Although you can configure the remote cache component to autostart (as a
subprocess if vscode itself), its typically preferable to just run it as a
system service or in it's own dedicated terminal, so the cache will be available
whether VSCode is running or not.

:::

## Configuration

![image](https://user-images.githubusercontent.com/50580/144519172-5f21ccbc-fb6f-4a9a-82d8-37d3f42d93ed.png)

Use the settings to enable/disable the cache, adjust it's max size, or change the startup port.

See documentation of the [remote cache cli](../cli/remote-cache) for more information.