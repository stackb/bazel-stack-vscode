---
layout: default
title: Debugging
permalink: /debugging
nav_order: 8
---

## Debugging (Starlark)

<p></p>

The bazel starlark interpreter (for `BUILD.bazel` and `*.bzl` files) supports a
[debugging
protocol](https://cs.opensource.google/bazel/bazel/+/master:src/main/java/com/google/devtools/build/lib/starlarkdebug/proto/starlark_debugging.proto).
Debugging is enabled via the following flag(s):

```python
bazel build //my:target
    --experimental_skylark_debug # required
    --experimental_skylark_debug_server_port=7300 # optional, 7300 is the default
    --experimental_skylark_debug_verbose_logging=true # optional, but helpful for debugging the protocol
```

If the `--experimental_skylark_debug` is set, the
[StarlarkDebuggerModule](https://cs.opensource.google/bazel/bazel/+/master:src/main/java/com/google/devtools/build/lib/starlarkdebug/module/StarlarkDebuggerModule.java;l=30;drc=253933f3adda134494a4f55838b3e16e54652f23;bpv=1;bpt=1?q=StarlarkDe&sq=&ss=bazel%2Fbazel)
is initialized that launches a socket and waits for a debugger to attach.  

> Note this happens early; no build events are sent before this time. > To abort
> the bazel command at this phase (waiting for a debugger client), you must kill
> the entire server.  Send a `SIGKILL` to the process (or Ctrl-C `SIGINT`
> thrice).

Once a debugger client connects to the port, communication begins over the
connection.  Protobufs are exchanged over the connection in the form of
length-delimited byte chunks.  The two main message types are:
1. `DebugRequest`: sent from the client to the server.  The client is
   responsible for managing an auto-incrementing `sequenceNumber`.
2. `DebugEvent`: sent from the server to the client either as:
   - a response to a request (in which the event is tagged with the corresponding
   `sequenceNumber`)
   - on an "ad-hoc" basis where the server is announcing events that have no
     corresponding request (`sequenceNumber=0`).

## Lifecycle of a Debugging Session

Once the debug client attaches to the socket, the server typically announces the
paused threads:

```proto
thread_paused {
    thread {
        id: 2556
        name: "skyframe-evaluator 7"
        pause_reason: INITIALIZING
        location {
            path: "/path/to/package/BUILD.bazel"
            line_number: 1
            column_number: 1
        }
    }
}
```


### EvaluateRequest

An `EvaluateRequest` takes the `thread_id` of the execution context and a
`statement` to evaluate.  Unfortunately, hovering over a symbol evaluates the
expression in the context of the innermost module (scope at the file level) and
not the current function or block scope.

