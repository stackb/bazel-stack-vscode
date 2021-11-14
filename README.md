# bazel-stack-vscode

[Bazel](https://bazel.build) Support for Visual Studio Code.

<table><tr>
<td style="width: 120px; text-align: center"><img src="https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Bazel_logo.svg/240px-Bazel_logo.svg.png" height="120"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/50580/78734740-486ba400-7906-11ea-89fa-f207544de185.png" height="100"/></td>
<td style="width: 120px; text-align: center"><img src="https://user-images.githubusercontent.com/29654835/27530004-e789a11e-5a13-11e7-8a34-870da7e678ac.PNG" height="100"/></td>
</tr><tr>
<td style="text-align: center">Bazel</td>
<td style="text-align: center">Stack</td>
<td style="text-align: center">VSCode</td>
</tr></table>

## Documentation

<https://stackb.github.io/bazel-stack-vscode/>

## Marketplace

<https://marketplace.visualstudio.com/items?itemName=StackBuild.bazel-stack-vscode>

This extension provides editor support for the starlark language and the bazel
dialect of starlark.

The following operating systems are supported:

- linux
- mac
- windows

> NOTE: while the list above is sorted alphabetically, windows is not an
> afterthought; one of the main supporters of bazel-stack-vscode is a
> windows-only shop).

## Contributions

The major contribution points include:

### Language

- `starlark` language (matches `.sky`, `.star` files).
- `bazel` language (matches `BUILD`, `BUILD.bazel`, `.bzl` and related files).
- `bazelrc` language (matches `.bazelrc` and related files).

### Grammar

- `starlark` grammar (syntax highlighting for `starlark` language).
- `bazel` grammar (syntax highlighting for `bazel` language).
- `bazelrc` grammar (syntax highlighting for `bazelrc` language).

### Commands

See [Keybindings](#keybindings) for description of commands bound to keyboard
shortcuts.  Other commands included are typically meant to be activated by menus
or buttons (see [Tools](#tools)).

### Keybindings

- `shift+cmd+space` runs the `bsv.bzl.redo` command; to use this, click on a
  build/test *code action* to run it the first time; then slap the space bar
  while holding down the command key to quickly rebuild/retest it.
- `ctrl+shift+cmd+b` runs the `bsv.bzl.copyLabel` command.  To use this, place
  your cursor in the `name` of a build rule (e.g. `name = "my_f|oo_library"`)
  and stroke the keybinding; the full label `//pkg/app:my_foo_library` will be
  copied to the clipboard.
- `cmd+;` runs the `bsv.bzl.goToLabel` command.  To use this, stroke the
  keybinding (designed to be ergonomically similar to the builtin `cmd+p` menu);
  this will open an input box where you can type/paste in a bazel label; press
  `ENTER` to move to the rule/file implied by the label.
- `shift+cmd+t` runs the `workbench.view.extension.bazel-explorer` command. This
  will show the [Tools](#tools).
- `ctrl+shift+cmd+p` runs the `bsv.buildozer.wizard` command.  To use this,
  stroke the keybinding; a sequence of input boxes / picks will guide you
  through formulating a buildozer command.

### View

- The `bazel-explorer` contains a number of so-called **Tools**.  Each tool has
  a similar look-and-feel for enablement, configuration, documentation/help, and
  possible launch/execution of the tool.  See [Tools](#tools) for reference.

### Debugger

- Support for `bazel` language debugging via the debug adapter protocol.  See
  description of the [Starlark Debugger Tool](#starlark-debugger-tool) for
  details.

### Breakpoint

- Support for setting breakpoints for the `bazel` language. See
  [Debugger](#debugger).

### Snippet

Assorted `bazel` language snippets for templating out rule, provider
implementations, etc.

## Tools

The *activity view* contains a list of tree items; each top-level item
represents a "tool".  The tool may be something like `buildifier`, which
actually downloads and runs an executable; or something like a *service* that
shows information (e.g. `bazel info`).

Each "tool" component has a set of configurable elements; to configure them
either expand the **Settings** tree item and click on it, or go directly to your
user/workspace settings and hunt for the corresponding configuration item (e.g.
`bsv.bzl.lsp.enableCodelenses`).


### Buildifier Tool

Buildifier provides linting and formatting support for the `bazel` language.  It
is highly recommended to always format on save: to do this, add the following to
your `settings.json`:

```json
"[bazel]": {
    "editor.formatOnSave": true
}
```

### Buildozer Tool

Buildozer performs bulk editing of BUILD files and can be very useful for
various refactoring activities.  If you are buildozer expert, you may not need
this.  For the rest of us who use buildozer relatively infrequently, you can use
the `bsv.buildozer.wizard` to help step through the various possibilities and
construct a buildozer command.  See [Keybindings](#keybindings).

### Starlark Debugger Tool

The starlark debugger tool launches the debug adapter tool when a `bazel`
language debug session is starting.  You can customize the settings used for the
adapter or the bazel server.

See the [Debugging](https://stackb.github.io/bazel-stack-vscode/debugging)
section of the docs for more details.

### Starlark Language Server Tool

The starlark language server provides LSP support for the `bazel` and `starlark`
languages.  Supported features include:

- **code actions**: code action links for `[LABEL]`, `build`, `test`, `run`, `debug`,
  `codesearch`, and `ui`.
  - `[LABEL]`: clicking on this code action will copy the label to the clipboard.
  - `build`: clicking on this code action will run `bazel build [LABEL]` in an
    integrated terminal.
  - `test`: clicking on this code action will run `bazel test [LABEL]` in an
    integrated terminal.
  - `run`: clicking on this code action will run `bazel run [LABEL]` in an
    integrated terminal.
  - `debug`: clicking on this code action will run `bazel build [LABEL]
    --experimental_skylark_debug` and start a starlark debugging session.
  - `codesearch`: clicking on this code action will show the [Codesearch
    UI](#code-search-tool) for that label.  This allows you to "livegrep"
    withing the transitive set of source files required to build `[LABEL]`.
  - `ui`: clicking on this code action will open an external link to the
    `[LABEL]` in the [Bzl UI](#bzl-ui-tool).
- **hover**: 
  - hover over a rule/provider/aspect to get documentation about the it (e.g. `ge*nrule`).
  - hover over a rule attribute to get documentation about the attribute (e.g.
    `s*rcs = ["...]`).
  - hover over a function to get documentation about the function (e.g.
    `ran*ge(1, 1, 1)`).
- **completion**:
  - completion for core starlark functions (e.g. type `rev` ->
    `reversed(sequence)`).
  - completion for bazel builtin function/rules/providers/attributes (e.g. `jav`
    -> `java_binary(...)`).
  - completion for third-party and custom starlark rules is available on a
    subscription basis.
- **jump-to-definition**:
  - `F12` on any string literal; if it looks like a relative or canonical bazel
    label, will open the corresponding BUILD or source file (works with default and
    external workspaces).

### Remote Cache Tool

The `bzl` tool contains a lightweight and fast LRU [remote
cache](https://docs.bazel.build/versions/main/remote-caching.html)
implementation.

This "locally-running" remote cache is actually 30% faster than using the
`--disk_cache` option (and manages disk usage better).  If you have multiple
bazel repositories on your workstation (or are frequently switching git
branches) it is highly recommended to run this remote cache locally, at all
times.

The cache implementation also provides nice progress notifications for uploads
with a terminal-based progress bar.

Given that you may or may not have a vscode window running at all times, the
recommended strategy is to keep a terminal running (or system service) with
`/path/to/bzl cache --progress` and put the following in your `$HOME/.bazelrc`
file:

```bazelrc
build --remote_cache=grpc://localhost:2020
```

This will give a nice speedup for many actions that you'd otherwise be waiting
to unnecessarily rebuild.

### Bazel Tool

The bazel tool provides a view of the `bazel info` for a workspace.  It is also
used to configure default build/test flags used on conjuction with the language
server (see [Starlark Language Server](#starlark-language-server-tool)).

### Stack.Build Account Tool

The account tool is used to view account settings and/or signup for a pro
subscription.  If you and your team members are using the `bazel-stack-vscode`
extension at work, please encourage your product owner / manager / corp-entity
to get your team signed up.

Benefits of `pro` subscriptions include:

1. Autocompletion, hover documentation, and jump-to-definition for
   third-party/custom rulesets.  For example, this will automagically produce
   autocompletion for a `go_binary` rule from `@io_bazel_rules_go//go:def.bzl`,
   or for a `my_custom_rule` from `//bazel/internal/corp.bzl`. [COMING SOON].
2. Invocation details and build events within VSCode.
3. Execution log diff tool.
4. Running the `bzl` tool as a service within your organization to share
   invocation details (as a developer support tool).
5. Using the `bzl cache` tool in CI.
6. User support via slack.

### Bzl UI Tool

The `bzl` tool runs a webserver by default at `http://localhost:8080`.  The UI
provides a navigable display of core bazel concepts such as:

1. Show bazel workspaces on current machine.
2. Show packages within a workspace.
3. Show rules within a workspace (by type).
4. Show attributes of a rule.
5. Show external workspaces.
6. Codesearch UI.
7. Clickable dependency graph.

The UI is intended to be used as a form of documentation for the workspace to
assist with code presentations, code review, and onboarding of new team members.

### Code Search Tool

The code search tool implements a fast search code search engine.  If you are
familiar with [livegrep](https://github.com/livegrep/livegrep), this is like
livegrep for bazel queries.  The backend is not actually livegrep, but a custom
regexp implementation similar to
[google/codesearch](github.com/google/codesearch) with an API similar to
livegrep.

Bzl codesearch is unlike any other codesearch tool as it naturally includes all
source file dependencies in the query.

Using codesearch is a two-step process:

1. Build a search file index.
2. Run queries against the index.

The codesearch UI will guide you through that process.  See the docs for
[Searching](https://stackb.github.io/bazel-stack-vscode/searching) for more
details.

### Build Events Service Tool

The build event service configured the display of build events within VSCode. 

### Invocations Service Tool

The invocation service tool allows you to view and/or replay invocations.

### Event Stream Tool

The event stream service tool provide a realtime view of build events for build
invocations.


## Bazelrc Language

- syntax highlighting
- hover to get [flag reference](#Hover-Flags-to-Get-Inline-Documentation) & links to bazel docs / bazel codesearch
    