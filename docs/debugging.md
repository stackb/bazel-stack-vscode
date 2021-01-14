---
layout: default
title: Debugging
permalink: /debugging
nav_order: 8
---

## Debugging (Starlark)

<p></p>

> NOTICE: the starlark debugger experience is rough, unforgiving, and can be
> downright frustrating.  My personal recommendation is to avoid the debugger
> and simply use `print` statements in the starlark source code when debugging
> starlark issues. Note that you can freely edit `BUILD` and `*.bzl` files in
> `{OUTPUT_BASE}/external/{WORKSPACE_NAME}/...` to debug issues in external
> workspaces.

For those brave souls, continue reading below...

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

> Note this happens early; no build events are sent before this time. To abort
> the bazel command at this phase (waiting for a debugger client), you must kill
> the entire server.  Send a `SIGKILL` to the process (or Ctrl-C `SIGINT`
> thrice).

Once a debugger client connects to the port, communication begins over the
connection.  Protobufs are exchanged over the connection in the form of
length-delimited byte chunks.  The two main message types are:
1. `DebugRequest`: sent from the client to the server.  The client is
   responsible for managing a monotonically increasing `sequenceNumber`.
2. `DebugEvent`: sent from the server to the client either as:
   - a response to a request (in which the event is tagged with the corresponding
   `sequenceNumber`)
   - on an "ad-hoc" basis where the server is announcing events that have no
     corresponding request (`sequenceNumber=0`).

## DebugRequest 

The starlark debug server responds to the following `DebugRequest` payloads:

1. `StartDebuggingRequest`: causes all threads to be resumed.
2. `ListFramesRequest`: list the stack frames of a thread.
3. `SetBreakpointsRequest`: replaces all breakpoints.
4. `ContinueExecutionRequest`: request to continue execution on a paused or
   stepping thread.
5. `PauseThreadRequest`: request to pause execution of a thread, or all threads.
6. `EvaluateRequest`: evaluate a Starlark statement in a thread's current
   environment.
7. `GetChildrenRequest`: request to list the children of a
   previously-communicated Value, such as its elements (for a list or
   dictionary), its fields (for a struct), and so forth

## Lifecycle of a Debugging Session

Once the debug client attaches to the socket, the server typically announces the
set of paused threads:

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

At this point the debug client sends a `DebugRequest.SetBreakpointsRequest` with
the list of desired breakpoints.  

The vscode sends a `ListFramesRequest` for each thread, and may populate the
debug UI with additional `GetChildrenRequest` to populate stackframe scope
variables.

This is followed by a `DebugRequest.StartDebuggingRequest` that resumes all
threads.

Evaluation continues until a breakpoint is hit, at which time a
`DebugEvent.PausedThread` is relayed back to the client.

Stepping or continuation requests are triggered by the user.  Hovering over
symbols triggers `EvaluateRequest` to populate hover cards.

### EvaluateRequest

An `EvaluateRequest` takes the `thread_id` of the execution context and a
`statement` to evaluate.  

Unfortunately, hovering over a symbol evaluates the expression in the context of
the innermost module (scope at the file level) and not the current function or
block scope.

This extension uses a hack to try and lookup the hover symbol in the list of
known local variables.

## Issues

- Once the debug session has started, it can be a pain to exit.  Sometimes the
  thread continuation does not seem to progress as expected.  To terminate a
  debug session, it is not unusual to simply have to sigkill the bazel server.
- Due to bazel's aggressive internal caching, it can be hard to predict when
  starlark code will be evaluated or not.  At a minimum you must introduce
  spurious file changes to trigger re-evaluation, or use flags such as
  `--nouse_action_cache`.
- You can only step into other starlark code.  Any functions that are
  implemented via java cannot be stepped into.  Even then, sometimes you cannot
  step into functions that you would expect to be able to step into.
- It is not intuitive what or where a breakpoint should be.  For example, does
  it make sense to set a breakpoint on the `srcs` attribute of a `go_library`,
  or only on the line where the rule name is declared?
- Hovering over symbols usually does not work because the evaluation does not
  seem to take into account the local variables.
- Certain operations can crash the server: for example, while trying to expand
  the `_ctx` variable of the `go` struct:

```
DEBUG: Received debug client request:
sequence_number: 28
get_children {
  thread_id: 3228
  value_id: 70
}
ERROR: Debug server listener thread died: com.google.devtools.build.lib.analysis.CachingAnalysisEnvironment$MissingDepException: Restart due to missing build info
        at com.google.devtools.build.lib.analysis.CachingAnalysisEnvironment.getWorkspaceStatusValue(CachingAnalysisEnvironment.java:379)
        at com.google.devtools.build.lib.analysis.CachingAnalysisEnvironment.getStableWorkspaceStatusArtifact(CachingAnalysisEnvironment.java:367)
        at com.google.devtools.build.lib.analysis.skylark.StarlarkRuleContext.getStableWorkspaceStatus(StarlarkRuleContext.java:860)
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
        at java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke(Unknown Source)
        at java.base/jdk.internal.reflect.DelegatingMethodAccessorImpl.invoke(Unknown Source)
        at java.base/java.lang.reflect.Method.invoke(Unknown Source)
        at com.google.devtools.build.lib.syntax.MethodDescriptor.call(MethodDescriptor.java:130)
        at com.google.devtools.build.lib.syntax.MethodDescriptor.callField(MethodDescriptor.java:115)
        at com.google.devtools.build.lib.syntax.CallUtils.getField(CallUtils.java:177)
        at com.google.devtools.build.lib.starlarkdebug.server.DebuggerSerialization.getChildren(DebuggerSerialization.java:145)
        at com.google.devtools.build.lib.starlarkdebug.server.DebuggerSerialization.getChildren(DebuggerSerialization.java:108)
        at com.google.devtools.build.lib.starlarkdebug.server.ThreadHandler.getChildrenForValue(ThreadHandler.java:262)
        at com.google.devtools.build.lib.starlarkdebug.server.StarlarkDebugServer.getChildren(StarlarkDebugServer.java:212)
        at com.google.devtools.build.lib.starlarkdebug.server.StarlarkDebugServer.handleClientRequest(StarlarkDebugServer.java:172)
        at com.google.devtools.build.lib.starlarkdebug.server.StarlarkDebugServer.lambda$listenForClientRequests$0(StarlarkDebugServer.java:94)
        at java.base/java.lang.Thread.run(Unknown Source)
```