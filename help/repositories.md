# Bazel Repositories View

The bazel repositories view lists filesystem directories on your workstation.

Click on the tree item to switch / open folder.

Click on the "Stack" icon to explore it in the browser.

## Troubleshooting

### "No bazel repositories were found"

![no bazel repositories](https://user-images.githubusercontent.com/50580/93528056-0011d280-f8f7-11ea-9a6d-bde1fca0e425.png)

Bzl scans the expected location for "output roots" to discover bazel
repositories on your workstation.  If none are found, this message can occur.  

This is due to several possible root causes:

1. You actually don't have any filesystem directories with a `WORKSPACE`.
   To fix, create one and run `bazel info output_root` (this will create the
   `output_root`).
2. All your workspaces have been cleaned/expunged.  `bazel clean --expunge` will
   delete the `output_base`.
3. You have a non-standard location where you are persisting output bases,
   perhaps with the `--output_user_root` flag.  To fix, configure the
   `feature.bzl.server.command` extension setting to include the flag
   `--repository_output_user_root=/path/to/output_user_root`.  This will allow
   bzl to scan subdirectories of this location.
4. A bug in Bzl that prevented it from finding your repositories.

Additional steps to resolve this issue:

1. Start vscode in a bazel repository.
2. Explicitly configure the location of bazel repositories on your filesystem.
   To fix, configure the
   `feature.bzl.server.command` extension setting to include the flag
   `--repository_dir=/path/to/bazel_repo`.
