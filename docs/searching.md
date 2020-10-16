---
layout: default
title: Searching
permalink: /searching
nav_order: 5
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

- To (re-)create the index, click the `Index` lens.
- To search, click the `Search` lens.
- Click on a matching line to nagivate to the file.

Display of the code lenses is dependent on knowing which bazel workspace you are
operating within, so if you don't see them after opening your `launch.bazelrc`
file, open the Bazel activity view pane.

> Note that you are responsible for updating the index manually, there isn't
currently a way to have the index automatically be updated.
