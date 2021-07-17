// Original file: proto/remote_execution.proto

/**
 * A single property for [FileNodes][build.bazel.remote.execution.v2.FileNode],
 * [DirectoryNodes][build.bazel.remote.execution.v2.DirectoryNode], and
 * [SymlinkNodes][build.bazel.remote.execution.v2.SymlinkNode]. The server is
 * responsible for specifying the property `name`s that it accepts. If
 * permitted by the server, the same `name` may occur multiple times.
 */
export interface NodeProperty {
  /**
   * The property name.
   */
  name?: string;
  /**
   * The property value.
   */
  value?: string;
}

/**
 * A single property for [FileNodes][build.bazel.remote.execution.v2.FileNode],
 * [DirectoryNodes][build.bazel.remote.execution.v2.DirectoryNode], and
 * [SymlinkNodes][build.bazel.remote.execution.v2.SymlinkNode]. The server is
 * responsible for specifying the property `name`s that it accepts. If
 * permitted by the server, the same `name` may occur multiple times.
 */
export interface NodeProperty__Output {
  /**
   * The property name.
   */
  name: string;
  /**
   * The property value.
   */
  value: string;
}
