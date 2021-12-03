---
id: codesearch
title: Code Search
---

The Code Search component hosts the codesearch webview.

Codesearch is similar to [livegrep](https://github.com/livegrep/livegrep) in
that is supports regular expression based fast searching of a code repository
(aka "index").

In this case, the "index" (corpus of files to be searched) is determined by a
[bazel query](https://docs.bazel.build/versions/main/query-how-to.html).

For example, imagine you needed to find all usages of
https://pkg.go.dev/syscall#Flock within your `go_binary` named `//corp_app`.
This is probably straightforward for "first-party" references; for this you
could just search the repository itself.  However, "third-party" code (external
dependencies) would be excluded from this search.

This codesearch feature allows you to define a search space of
`deps(//corp_app)`, thereby allowing you to find *all* `.Flock` code references
for the app.

## Configuration

![image](https://user-images.githubusercontent.com/50580/144536743-3b397838-305b-49f3-9dd6-b74912c895fb.png)

Use the settings tree item to customize the default search settings.

## Usage

Click on a [codesearch codelens action link](starlark-language-server#codelens)
to open the codesearch webview:

![image](https://user-images.githubusercontent.com/50580/144537715-1b754619-e062-4023-ae7a-5c356a63955a.png)

To (re)create the search index, click the **[Recreate Index]** button:

![image](https://user-images.githubusercontent.com/50580/144537772-977b43b4-1ef6-44de-8c6a-eeb197292a76.png)

Then start typing in the query input.  Click on a line or highlighted search hit to navigate to the file.

![image](https://user-images.githubusercontent.com/50580/144538088-a25005f0-6578-4eb2-bbf5-ebd64223c6aa.png)

## CLI

Codesearch can be run in the CLI as well, see [codesearch cli
documentation](cli/codesearch) for details.
