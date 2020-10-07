---
layout: default
title: Events
parent: Navigating
permalink: /navigating/events
nav_order: 5
---

## Event Explorer

<p></p>

The event explorer displays realtime output of the build event protocol:

![bep](https://user-images.githubusercontent.com/50580/95296670-6921a180-0836-11eb-9346-2a77916158b1.gif)

For simplicity, only a subset of events are typically shown:

- `BuildStarted` event
- `ActionExecuted` event
- `TargetComplete` event
- `TestResult` event (if failed)
- `BuildFinished` event

To get a more comprehensive view of the build events, use the Bzl UI.

#### BuildStarted

Provides insight into the bazel tool version, workspace directory, command, and
bazel flags used to invoke the command.

#### ActionExecuted

Displays the command line used to execute the action.  Use the `[Stdout]` and
`[Stderr]` buttons to view the outputs of the action.

#### TestResult

Displays the outcome of an individual test.  Use the `[Log]` button to view the
test log output.

#### TargetCompleted

Displays the label that was completed.  Typically names the files that were
generated as completion outputs.

Use the `[Download]` or `[Save]` button to copy the output to your filesystem
(this is typically only useful when *remoting*).

#### BuildFinished

Provides insight into the timing and overall outcome status.

## Action Diagnostics

*Problems* detected from the action outputs are displayed in the view as well as
the **Problems Panel** (diagnostics).  Click on a diagnostic to go to the
`file:line:column` where the problem occurred:

![problem](https://user-images.githubusercontent.com/50580/95297348-915dd000-0837-11eb-894a-2228f54812f5.gif)


VSCode has built-in keyboard shortcuts that make it easy to progress through the
list of problems.

## Invocation Summary

To view a summary of the build invocation, click the `[Explore]` icon (on the
`BuildStarted` tree item):

![invocation](https://user-images.githubusercontent.com/50580/95299854-9b81cd80-083b-11eb-8f0e-3e925e5885a1.gif)
