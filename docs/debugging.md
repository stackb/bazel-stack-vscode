---
layout: default
title: Debugging
permalink: /debugging
nav_order: 7
---

## Debugging

<p></p>

This extension supports debugging of Starlark files (language mode: `bazel`).

A debug session can be started using an `attach` or `launch` [debug
configuration](https://code.visualstudio.com/docs/editor/debugging).  An
`attach` configuration provides the most control but requires you to start the
components independently, whereas a `launch` configuration will attempt to start
the debug adapter and bazel server for you.

## Launch

Although a `launch.json` configuration is not specifically required to start a
debug session it is recommended to create one.  Click on the "gear" icon in the
debug activity panel, or run the **Open 'launch.json'** command.

<img width="1290" alt="Screen Shot 2021-10-23 at 9 38 13 PM" src="https://user-images.githubusercontent.com/50580/138579557-289b5649-7f26-4e46-b239-10516cfa0c54.png">

Select **Starlark Debug: Launch** configuration snippet:

<img width="1290" alt="Screen Shot 2021-10-23 at 9 38 21 PM" src="https://user-images.githubusercontent.com/50580/138579561-175271ad-fbee-49f7-bf30-9411ece2dece.png">

Edit the selected text to configure the bazel target: 

<img width="1290" alt="Screen Shot 2021-10-23 at 9 38 33 PM" src="https://user-images.githubusercontent.com/50580/138579564-f7d493d7-aa56-484d-9eab-b015fc13d42c.png">

This is bazel label that will be used when launching a `bazel build --experimental_skylark_debug` command.

<img width="1290" alt="Screen Shot 2021-10-23 at 9 38 45 PM" src="https://user-images.githubusercontent.com/50580/138579565-cb095447-9347-4399-aba8-1f793b0f237d.png">

To start the debug session, press `F5` or click on associated **Run and Debug** configuration.

<img width="1290" alt="Screen Shot 2021-10-23 at 9 40 02 PM" src="https://user-images.githubusercontent.com/50580/138579566-4171e37a-1e95-49ef-b5da-36e208a10cde.png">

Note that the `bazel build //:buildifier --experimental_skylark_debug` has been
started in an integrated VSCode terminal.  You should keep an eye on this
terminal.  

For example, one reason that a debug session is immediately terminating is that
the build files have already been parsed and remain cached by bazel's
incrementality model.

You will likely want to make manual changes to the `.bzl` file of interest while
debugging to force bazel to re-evaluate that file and allow the debugger to
pause the starlark thread on your breakpoint.

Also note that a different integrated terminal is running the `bzl debug
adapter` command.  This tool translates VSCode's debugging protocol into the
`skylark_debugging.proto` format.

You can add additional bazel flags as shown below:

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "starlark",
            "request": "launch",
            "name": "Starlark debug //:buildifier",
            "targetLabel": "//:buildifier",
            "extraBazelFlags": [
                "--config=bzl"
            ]
        }
    ]
}
```

## Attach

To run an `attach` debug session, create a corresponding attach configuration:

```json
        {
            "type": "starlark",
            "request": "attach",
            "name": "Attach to a running Starlark Debug Adapter",
            "debugServer": 4711
        },
```

The `"debugServer": 4711` part is the default so it's not explicitly required.
This is the TCP port VSCode will use to communicate with the debug adapter.

To launch the adapter, run `bzl debug adapter`, or launch it from the component
activity panel:

<img width="1290" alt="Screen Shot 2021-10-23 at 10 01 56 PM" src="https://user-images.githubusercontent.com/50580/138580187-5e68a8ce-c61c-4908-9d89-4fc5d8253494.png">

This will start the debug adapter in an integrated terminal.

<img width="1290" alt="Screen Shot 2021-10-23 at 10 02 06 PM" src="https://user-images.githubusercontent.com/50580/138580191-6488cd46-20fa-47d2-8fea-188020aeeb3c.png">

At this point, you'll need to manually run a `bazel build //something
--experimental_skylark_debug` in the terminal of your choice.

Then, `F5` and start a debug session using the selected debug configuration.

> NOTE: see below regarding the `DEFAULT.WORKSPACE` file.  Since the debug
> adapter will run a `bazel query` upon startup, you should always start the
> adapter before `--experimental_skylark_debug` (the server will be holding the
> workspace LOCK waiting for a client to attach; while the client is waiting for
> the LOCK to be released for the bazel query).

## DEFAULT.WORKSPACE

When a debug session starts from a clean slate, the starlark interpreter starts
by parsing your `WORKSPACE` file.

Internally, bazel adds extra content to the front and back of your workspace
before actually slicing it into chunks (delimited by `load()` statements).

While the `/DEFAULT.WORKSPACE` and `/DEFAULT.WORKSPACE.SUFFIX` files only really
exist in memory, for the sake of the debug experience, we can "fake" it by
writing a mocks of these onto disk.

The files will be prepared automatically at `${bazel-bin}/DEFAULT.WORKSPACE` and
`${bazel-bin}/DEFAULT.WORKSPACE.SUFFIX`. The files are prepared via running
`bazel query //external:* --output build` and shifting the rules into their
corresponding line locations.

The issue that might trip you up is

To skip this part, run `bzl debug adapter
--make_default_workspace_content=false`.
