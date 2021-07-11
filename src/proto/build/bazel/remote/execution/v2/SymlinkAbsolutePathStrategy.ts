// Original file: proto/remote_execution.proto


// Original file: proto/remote_execution.proto

export enum _build_bazel_remote_execution_v2_SymlinkAbsolutePathStrategy_Value {
  /**
   * Invalid value.
   */
  UNKNOWN = 0,
  /**
   * Server will return an `INVALID_ARGUMENT` on input symlinks with absolute
   * targets.
   * If an action tries to create an output symlink with an absolute target, a
   * `FAILED_PRECONDITION` will be returned.
   */
  DISALLOWED = 1,
  /**
   * Server will allow symlink targets to escape the input root tree, possibly
   * resulting in non-hermetic builds.
   */
  ALLOWED = 2,
}

/**
 * Describes how the server treats absolute symlink targets.
 */
export interface SymlinkAbsolutePathStrategy {
}

/**
 * Describes how the server treats absolute symlink targets.
 */
export interface SymlinkAbsolutePathStrategy__Output {
}
