---
layout: default
title: Debugging
permalink: /debugging
nav_order: 7
---

## Debugging

<p></p>

This extension supports debugging of Starlark (language mode: `bazel`) files.

A debug session can be started if `attach` or `launch` mode.  An `attach`
configuration provides the most control, but requires you to start the
components independently, whereas a `launch` configuration will attempt to start
the debug adapter and bazel server for you.

### Launch

Although a `launch.json` configuration is not specifically required to start a
debug session, it is recommended to create one.



Make sure the "Starlark Debugger" component is enabled in the Explorer.

<img width="573" alt="Screen Shot 2021-10-18 at 10 32 11 PM" src="https://user-images.githubusercontent.com/50580/137844816-72f4137e-dc23-4bcc-a369-f260dd1263af.png">

Ensure you have a launch configuration in your `.vscode/launch.json` file.  Use the "Add Configuration" and search for the one named **Attach to a running Starlark Debug Adapter**.  
    > You can also use the snippet `{ "type": "starlark", "request": "attach", "name": "Attach to a running Starlark Debug Adapter" }`)

<img width="1597" alt="Screen Shot 2021-10-18 at 10 37 50 PM" src="https://user-images.githubusercontent.com/50580/137845082-90b187f5-7a78-4420-9890-ae8c5dd938b4.png">

<img width="1597" alt="Screen Shot 2021-10-18 at 10 38 10 PM" src="https://user-images.githubusercontent.com/50580/137845090-2346b1db-2616-49fc-9b3b-1d0df8237b8f.png">

Click on a **debug** codelens to start a debugging session.

<img width="681" alt="Screen Shot 2021-10-18 at 10 35 41 PM" src="https://user-images.githubusercontent.com/50580/137844817-d25bf7d1-fe60-4108-9a26-de42ce36da2c.png">

The debug adapter should launch in a VSCode terminal window (you can also launch this manually in the explorer).

Another terminal window will be launched where bazel will be run in debug server mode.

<img width="1597" alt="Screen Shot 2021-10-18 at 10 39 49 PM" src="https://user-images.githubusercontent.com/50580/137845093-31b083fc-4a54-4389-b5dc-af4bd69fd947.png">
