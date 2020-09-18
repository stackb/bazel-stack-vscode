# Change Log

## 0.5.0 (Thu Set 17 2020)

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
