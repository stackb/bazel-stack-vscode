// Original file: proto/bzl.proto

/**
 * An external bazel workspace
 */
export interface ExternalWorkspace {
  /**
   * The name of the workspace such as @foo (excluding the at-sign)
   */
  name?: string;
  /**
   * The type of defining repository rule
   */
  ruleClass?: string;
  /**
   * The actual target, in the case this is a bind
   */
  actual?: string;
  /**
   * Location of the defining rule
   * (/home/foo/path/to/workspace/workspace.bzl:204:5 => workspace.bzl:204:5)
   */
  relativeLocation?: string;
  /**
   * Adding an ID field to hold and slash-excaped form.  In the case where
   * "name" = "android/sdk", the "id" = "android_sdk"
   */
  id?: string;
  /**
   * a flag to indicate if this is a predefined or 'bazel internal' workspace.
   * These include anything with the location /DEFAULT.WORKSPACE or defined
   * within `external/bazel_tools/...`.
   */
  predefined?: boolean;
}

/**
 * An external bazel workspace
 */
export interface ExternalWorkspace__Output {
  /**
   * The name of the workspace such as @foo (excluding the at-sign)
   */
  name: string;
  /**
   * The type of defining repository rule
   */
  ruleClass: string;
  /**
   * The actual target, in the case this is a bind
   */
  actual: string;
  /**
   * Location of the defining rule
   * (/home/foo/path/to/workspace/workspace.bzl:204:5 => workspace.bzl:204:5)
   */
  relativeLocation: string;
  /**
   * Adding an ID field to hold and slash-excaped form.  In the case where
   * "name" = "android/sdk", the "id" = "android_sdk"
   */
  id: string;
  /**
   * a flag to indicate if this is a predefined or 'bazel internal' workspace.
   * These include anything with the location /DEFAULT.WORKSPACE or defined
   * within `external/bazel_tools/...`.
   */
  predefined: boolean;
}
