---
id: debugger
title: Starlark Debugger
---

import ReactPlayer from 'react-player'

The Starlark Debugger component manages starlark debug sessions.

There are three actors in the system:

1. VSCode acts as the *debug client* that requests thread, stack frame, and variable
   information over the *debug adapter protocol* (DAP). 
1. Bazel is the *debug server* that sends thread, stack frame, and variable
   information over a protocol buffer based API.
1. The `bzl debug adapter` command acts as in intermediary between the two,
   translating between the DAP and protobuf schema.

## Usage via "Code Action" Link

The debugger *should* work out of the box by clicking on a `debug` code action:

![image](https://user-images.githubusercontent.com/50580/144439494-8e37f41a-2e1d-4d2a-b73e-fda50c13c1fc.png)

When clicked, three things are happening:

1. The debug adapter is launched in an integrated terminal, listening on port `:4711`.  You don't need to watch this, just know that it's there.

2. A second integrated terminal is launched that invokes `bazel build --experimental_skylark_debug`:

    ![image](https://user-images.githubusercontent.com/50580/144440559-8a112b23-5268-4c90-a3cc-52395627983b.png)

    Keep an eye on this terminal if things aren't working as expected.  Most
    likely, the process exited because the starlark parsing/execution was
    incrementally cached; in that case the debugger will never hit your
    breakpoint.

3. VSCode starts a *debug session*, communicating over port `:4711` with the
   debug adapter.  In this scenario, a *debug configuration* was dynamically
   generated.


## Debug Configurations

Instead of using a dynamically-generated *debug configuration*, you may want to
create a "static" configuration.  This provides more control over the specifics
of the debug session.  You have two basic choices:

1. A `launch` configuration.  In this scenario the bazel server and debug
   adapter are automatically run (as described in the code action scenario
   above).

2. An `attach` configuration.  In this scenario, you are responsible for
   starting up the server and adapter yourself.

### Launch Configuration

To create a debug configuration, click on the *debug settings* "gear" icon:

![image](https://user-images.githubusercontent.com/50580/144442486-b0b7499b-f027-4da4-97c7-3e127fb1e94f.png)

Click the `[Add Configuration]` button and scroll down to `Starlark Debug: Launch`:

![image](https://user-images.githubusercontent.com/50580/144442534-acc18a5e-d176-46b1-aaab-7f28c0d0f388.png)

Fill in the bazel label that should be used when launching the bazel server process:

![image](https://user-images.githubusercontent.com/50580/144442735-8a6e5366-7a94-4ccb-a0e1-fdd69bfface4.png)

```json
{
    "configurations": [
        {
            "type": "starlark",
            "request": "launch",
            "name": "Starlark debug //example/routeguide:routeguide_nodejs_library",
            "targetLabel": "//example/routeguide:routeguide_nodejs_library"
        }
    ]
}
```

At this point, you can start a debug sesssion under this configuration by
manually choosing in the dropdown (or press `F5`): 

![image](https://user-images.githubusercontent.com/50580/144443989-4e454137-c29b-4e04-87db-fb5b0eed41cb.png)

:::note
When the bazel debug server is launched, the flags used on the command line are taken from the `bsv.bazel.starlarkDebugFlags` setting.  You can add `--experimental_skylark_debug_verbose_logging` here, if desired.
:::

![image](https://user-images.githubusercontent.com/50580/144522108-ea529e73-02e3-4dca-a5ea-5fda77f39db4.png)

### Attach Configuration

Using `attach` is the preferred method if things aren't working correctly or you
need more control over starting the `bazel` invocation.

Follow the same procedure to create an attach configuration, or enter it
manually in your `.vscode/launch.json` file:

```json
{
    "configurations": [
        {
            "type": "starlark",
            "request": "attach",
            "name": "Attach to a running Starlark Debug Adapter",
            "debugServer": 4711
        }
    ]
}
```
:::note
`"debugServer": 4711` is the default and does not need to be explicitly provided.
:::

Perform the following steps:

1. Launch the `bzl debug adapter` somewhere.  You can use the `Launch` tree item
   in the component UI, or run the executable directly.

   :::caution
   When the debug adapter starts up, it runs a bazel query to prepare several
   files.  If you already have a bazel invocation running, this can block.  If
   this is an issue, run the adapter with
   `--make_default_workspace_content=false`.
   :::

2. Start your bazel command using the `--experimental_skylark_debug` flag. The
   server will block waiting for a client connection.

    :::tip
    Use the `--experimental_skylark_debug_verbose_logging` flag to get extra info from the server.
    :::

3. Start a debug session with `F5` using the attach configuration.

## Caveats

1. Don't expect the starlark debug experience to be as nice as javascript
   debugging, for example.  It's not as polished of a toolset.

2. Be prepared to make trivial changes in file of interest to force bazel to
   re-evaluate the file.

3. Hovering over variables generally does not work.

4. Conditional breakpoints don't work.

5. You can only use `bazel build` for debugging.

See https://www.youtube.com/watch?v=MAXJA8Gbtxk for a conference presentation on the debugger:

<ReactPlayer controls url='https://www.youtube.com/watch?v=MAXJA8Gbtxk' />