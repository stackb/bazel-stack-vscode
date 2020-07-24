# Change Log

## 0.3.2 (Thu July 23 2020)

- Bugfix for buildifier install on windows.

## 0.3.1 (Wed July 22 2020)

- Bugfix for misplaced runtime dependency in `devDependencies` causing extension
  to not load.

## 0.3.0 (Wed July 22 2020)

- Add buildifier formatting/linting
- Refactor extension to IExtensionFeature

## 0.2.0 (Tue July 21 2020)

- Implement a `HoverProvider` for symbols in bazel-starlark files.  If the word
  is a builtin function call a tooltip is provided with a link to the bazel
  documentation.
- Add grammar for `bazel` files
- Add grammar for `starlark` files
- Add grammar for `bazelrc` files

## 0.1.0

- Initial release