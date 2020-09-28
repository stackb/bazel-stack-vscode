// Original file: proto/bzl.proto

/**
 * Describes various kinds of files used in requests
 */
export enum FileKind {
  KIND_UNKNOWN = 0,
  /**
   * a source file
   */
  SOURCE = 1,
  /**
   * a generated file
   */
  GENERATED = 2,
  /**
   * an output file, generally in CWD and starts with bazel-out/...
   */
  OUTPUT = 3,
  /**
   * a file rooted in the output_base tree
   */
  OUTPUT_BASE = 4,
  /**
   * a file rooted in the execroot tree
   */
  EXECROOT = 5,
  /**
   * an external source file
   */
  EXTERNAL = 6,
}
