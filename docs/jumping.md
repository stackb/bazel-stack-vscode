---
layout: default
title: Jumping
permalink: /jumping
nav_order: 6
---

## Jump to Definition

<p></p>

**Jump to Definition** (Go to definition) is provided for `BUILD` file labels
(typically, this is mapped to the keyboard shortcut `F12`). 

The starlark string literal at the current cursor position is used to
locate the target file.

Jump to definition has the following "best-effort" semantics:

- If the label represents a *source file* (e.g. `//:main.go`), open at the
  beginning of the file.
- If the label represents a *rule* (e.g. `//:myrule`), open the `BUILD` file at
  the corresponding rule definition.
- If the rule cannot be found within the `BUILD` file, no action is taken.
- If the label is in an external workspace (e.g. `@foo//:bar`), open the
  file/rule in the external workspace `foo`.  This behavior requires that the
  bazel server for the repository be running.

![jtd](https://user-images.githubusercontent.com/50580/97131325-78935c80-1709-11eb-86d5-a6c96d47bab8.gif)
