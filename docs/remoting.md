---
layout: default
title: Remoting
permalink: /remoting
nav_order: 8
---

## Remoting

<p></p>

For cases where one needs to build on one architecture and test on another, it
can be useful to be able to drive bazel remotely and access file outputs
rapidly (by downloading `TargetComplete` outputs).

For these use cases it is possible to expose a `Bzl` server running on one
machine to a VSCode instance on a different machine.  All that is required is a
TCP connection to the remote server:

![remoting](https://user-images.githubusercontent.com/50580/95298134-d46c7300-0838-11eb-8582-1cb1f5c33859.gif)

Note in this contrived example we are remoting to self.  Although `ngrok` is
used in this example, you should only remote within your own intranet for
security purposes.