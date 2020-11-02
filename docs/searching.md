---
layout: default
title: Searching
permalink: /searching
nav_order: 9
---

## Codesearch

<p></p>

The codesearch feature allows one to:

1. create a search index of source files
defined by a bazel query
1. query the index (optionally with regular expressions).

To define a codesearch index, add a line to your `launch.bazelrc` such as:

```
codesearch deps(//...)
```

Upon save, vscode will add two *code lenses* above the line:

![codesearch-define](https://user-images.githubusercontent.com/50580/96071853-3abc4b80-0e60-11eb-8d3b-897004d5bd8c.gif)

- To (re-)create the index, click the `Index` lens.  You can also click the
  **[Recreate Index]** button once inside the search panel.
- To search, click the `Search` lens.
- Click on a matching line to nagivate to the file.

Display of the code lenses is dependent on knowing which bazel workspace you are
operating within, so if you don't see them after opening your `launch.bazelrc`
file, open the Bazel activity view pane.

> Note that you are responsible for updating the index manually, they are not
> automatically updated.

## Default Index

A fallback codesearch index is configured "out of the box" if you don't have a
`launch.bazelrc` file.  By default this is defined as `deps(//...)` but can be
configured in your user settings via the `bsv.bzl.codesearch.default.query`
setting.

The default index is selected when codesearch is selected via the command palette,
keyboard shortcut (`ctrl+shift+cmd+f`), or the search icon in the navigation bar
of the `Repositories` list.

Note that the default index only *configured* out of the box.  You still are
required to (re-)build it as needed.

## Cleaning up

If you'd like to remove an index, you can safely remove the directory where the
index is stored (this is printed as the final output line during indexing).

Indexes are stored within the outputBase of a workspace, so a `bazel clean` will
also remove all codesearch indexes.

## Options

You can add command line options to the `bazel query` using `--` to terminate
the query expression from the options.  For example, this uses the
`--noimplicit_deps` option:

```
codesearch deps(//...) -- --noimplicit_deps
```
