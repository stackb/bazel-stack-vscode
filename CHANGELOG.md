# Change Log

## 1.5.0 (Nov 14 2021)

- Add buildozer activity component.
- Bump bzl to `1.1.1` (new LSP autocompletion, improved hover support)

## 1.4.0 (Nov 4 2021)

- Add buildozer wizard.
- Add buildozer component.
- Update buildtools to 4.2.3
## 1.3.0 (Oct 23 2021)

- Add starlark debug launch support.

## 1.2.3 (Oct 19 2021)

- 2021-10-19 22:57:34 -0600 GitHub: Fix textdocumentdefinition for external labels (#284)
- 2021-10-19 16:56:56 -0600 GitHub: Add mutex lock to protect fill in the mem stream (#283)

## 1.2.2 (Oct 19 2021)

- Bzl 1.0.4 (cache digest function fix)

## 1.2.1 (Oct 18 2021)

- Buildifier 4.2.2

## 1.2.0 (Oct 18 2021)

- Add starlark debug adapter

## 0.7.1 (May 5 2021)

- Update gostarlark to 0.9.11.
- Fix #49 (copy to label for root build file).

## 0.7.0 (May 4 2021)

- Update buildifier to 4.0.1.

## 0.6.7 (Jan 26 2020)

- Add "copy label to clipboard" command to starlark language server.
## 0.6.6 (Nov 19 2020)

- Auto-renew license upon expiration.
- Update bazel and stackb activity panel keybindings
- Update buildifier to 0.3.5
- Update bzl to 0.9.6

## 0.6.5 (Sun Nov 1 2020)

- Update bzl to include codesearch fixes/improvements.
- Allow multiple bzl instances to run without file locking.

## 0.6.4 (Mon Oct 25 2020)

- Fix https://github.com/stackb/bazel-stack-vscode/issues/36.

## 0.6.3 (Mon Oct 25 2020)

- Integrate gostarlark go to definition for bazel labels
- Improve "last run" semantics for build
- Regenerate protos with 0.6.0-pre17
- Added "copy to clipboard" command for output file paths


## 0.6.2 (Mon Oct 19 2020)

- Codesearch improvements
- Introduce Default index
- Override bazelrc codelens when bzl feature active
- Display fetch events

## 0.6.1 (Sun Oct 18 2020)

- Upgrade to bzl 0.9.2
- Add Bzl tool path
- Menu cleanup

## 0.6.0 (Thu Oct 15 2020)

- Codesearch feature

## 0.5.2 (Wed Oct 7 2020)

- Disable webpack bundling

## 0.5.1 (Wed Oct 7 2020)

- Add telemetry

## 0.5.0 (Wed Oct 7 2020)

- Experimental Bzl integration (disabled by default)

## 0.4.1 (Tue Aug 4 2020)

- Enable language server by default
- Bazelrc support (hover, completions, launch.bazelrc)

## 0.4.0 (Sat Aug 1 2020)

- Initial release of Starlark Language Server with HoverProvider implementation.

## 0.3.5 (Mon July 27 2020)

- Relax vscode version compatibility to 1.39.0 (Sept 2019).

## 0.3.4 (Sun July 26 2020)

- Bump buildifier dependency to 0.3.4.
- Better integration testing.

## 0.3.3 (Fri July 24 2020)

- Bugfix for creating globalStoragePath if not already exists.

## 0.3.2 (Thu July 23 2020)

- Bugfix for buildifier install on windows.

## 0.3.1 (Wed July 22 2020)

- Bugfix for misplaced runtime dependency in `devDependencies` causing extension
  to not load.

## 0.3.0 (Wed July 22 2020)

- Add buildifier formatting/linting
- Refactor extension to IExtensionFeature

## 0.2.0 (Tue July 21 2020)

- Implement a `HoverProvider` for symbols in bazel-starlark files. If the word
  is a builtin function call a tooltip is provided with a link to the bazel
  documentation.
- Add grammar for `bazel` files
- Add grammar for `starlark` files
- Add grammar for `bazelrc` files

## 0.1.0

- Initial release
