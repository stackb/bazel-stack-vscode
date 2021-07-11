// Original file: proto/remote_execution.proto

import type { OutputFile as _build_bazel_remote_execution_v2_OutputFile, OutputFile__Output as _build_bazel_remote_execution_v2_OutputFile__Output } from '../../../../../build/bazel/remote/execution/v2/OutputFile';
import type { OutputDirectory as _build_bazel_remote_execution_v2_OutputDirectory, OutputDirectory__Output as _build_bazel_remote_execution_v2_OutputDirectory__Output } from '../../../../../build/bazel/remote/execution/v2/OutputDirectory';
import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { ExecutedActionMetadata as _build_bazel_remote_execution_v2_ExecutedActionMetadata, ExecutedActionMetadata__Output as _build_bazel_remote_execution_v2_ExecutedActionMetadata__Output } from '../../../../../build/bazel/remote/execution/v2/ExecutedActionMetadata';
import type { OutputSymlink as _build_bazel_remote_execution_v2_OutputSymlink, OutputSymlink__Output as _build_bazel_remote_execution_v2_OutputSymlink__Output } from '../../../../../build/bazel/remote/execution/v2/OutputSymlink';

/**
 * An ActionResult represents the result of an
 * [Action][build.bazel.remote.execution.v2.Action] being run.
 */
export interface ActionResult {
  /**
   * The output files of the action. For each output file requested in the
   * `output_files` field of the Action, if the corresponding file existed after
   * the action completed, a single entry will be present either in this field,
   * or the `output_file_symlinks` field if the file was a symbolic link to
   * another file.
   * 
   * If an output of the same name was found, but was a directory rather
   * than a regular file, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputFiles'?: (_build_bazel_remote_execution_v2_OutputFile)[];
  /**
   * The output directories of the action. For each output directory requested
   * in the `output_directories` field of the Action, if the corresponding
   * directory existed after the action completed, a single entry will be
   * present in the output list, which will contain the digest of a
   * [Tree][build.bazel.remote.execution.v2.Tree] message containing the
   * directory tree, and the path equal exactly to the corresponding Action
   * output_directories member.
   * 
   * As an example, suppose the Action had an output directory `a/b/dir` and the
   * execution produced the following contents in `a/b/dir`: a file named `bar`
   * and a directory named `foo` with an executable file named `baz`. Then,
   * output_directory will contain (hashes shortened for readability):
   * 
   * ```json
   * // OutputDirectory proto:
   * {
   * path: "a/b/dir"
   * tree_digest: {
   * hash: "4a73bc9d03...",
   * size: 55
   * }
   * }
   * // Tree proto with hash "4a73bc9d03..." and size 55:
   * {
   * root: {
   * files: [
   * {
   * name: "bar",
   * digest: {
   * hash: "4a73bc9d03...",
   * size: 65534
   * }
   * }
   * ],
   * directories: [
   * {
   * name: "foo",
   * digest: {
   * hash: "4cf2eda940...",
   * size: 43
   * }
   * }
   * ]
   * }
   * children : {
   * // (Directory proto with hash "4cf2eda940..." and size 43)
   * files: [
   * {
   * name: "baz",
   * digest: {
   * hash: "b2c941073e...",
   * size: 1294,
   * },
   * is_executable: true
   * }
   * ]
   * }
   * }
   * ```
   * If an output of the same name was found, but was not a directory, the
   * server will return a FAILED_PRECONDITION.
   */
  'outputDirectories'?: (_build_bazel_remote_execution_v2_OutputDirectory)[];
  /**
   * The exit code of the command.
   */
  'exitCode'?: (number);
  /**
   * The standard output buffer of the action. The server SHOULD NOT inline
   * stdout unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'stdoutRaw'?: (Buffer | Uint8Array | string);
  /**
   * The digest for a blob containing the standard output of the action, which
   * can be retrieved from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'stdoutDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * The standard error buffer of the action. The server SHOULD NOT inline
   * stderr unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'stderrRaw'?: (Buffer | Uint8Array | string);
  /**
   * The digest for a blob containing the standard error of the action, which
   * can be retrieved from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'stderrDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * The details of the execution that originally produced this result.
   */
  'executionMetadata'?: (_build_bazel_remote_execution_v2_ExecutedActionMetadata | null);
  /**
   * The output files of the action that are symbolic links to other files.
   * Those may be links to other output files, or input files, or even absolute
   * paths outside of the working directory, if the server supports
   * [SymlinkAbsolutePathStrategy.ALLOWED][build.bazel.remote.execution.v2.CacheCapabilities.SymlinkAbsolutePathStrategy].
   * For each output file requested in the `output_files` field of the Action,
   * if the corresponding file existed after
   * the action completed, a single entry will be present either in this field,
   * or in the `output_files` field, if the file was not a symbolic link.
   * 
   * If an output symbolic link of the same name was found, but its target
   * type was not a regular file, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputFileSymlinks'?: (_build_bazel_remote_execution_v2_OutputSymlink)[];
  /**
   * The output directories of the action that are symbolic links to other
   * directories. Those may be links to other output directories, or input
   * directories, or even absolute paths outside of the working directory,
   * if the server supports
   * [SymlinkAbsolutePathStrategy.ALLOWED][build.bazel.remote.execution.v2.CacheCapabilities.SymlinkAbsolutePathStrategy].
   * For each output directory requested in the `output_directories` field of
   * the Action, if the directory existed after the action completed, a
   * single entry will be present either in this field, or in the
   * `output_directories` field, if the directory was not a symbolic link.
   * 
   * If an output of the same name was found, but was a symbolic link to a file
   * instead of a directory, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputDirectorySymlinks'?: (_build_bazel_remote_execution_v2_OutputSymlink)[];
}

/**
 * An ActionResult represents the result of an
 * [Action][build.bazel.remote.execution.v2.Action] being run.
 */
export interface ActionResult__Output {
  /**
   * The output files of the action. For each output file requested in the
   * `output_files` field of the Action, if the corresponding file existed after
   * the action completed, a single entry will be present either in this field,
   * or the `output_file_symlinks` field if the file was a symbolic link to
   * another file.
   * 
   * If an output of the same name was found, but was a directory rather
   * than a regular file, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputFiles': (_build_bazel_remote_execution_v2_OutputFile__Output)[];
  /**
   * The output directories of the action. For each output directory requested
   * in the `output_directories` field of the Action, if the corresponding
   * directory existed after the action completed, a single entry will be
   * present in the output list, which will contain the digest of a
   * [Tree][build.bazel.remote.execution.v2.Tree] message containing the
   * directory tree, and the path equal exactly to the corresponding Action
   * output_directories member.
   * 
   * As an example, suppose the Action had an output directory `a/b/dir` and the
   * execution produced the following contents in `a/b/dir`: a file named `bar`
   * and a directory named `foo` with an executable file named `baz`. Then,
   * output_directory will contain (hashes shortened for readability):
   * 
   * ```json
   * // OutputDirectory proto:
   * {
   * path: "a/b/dir"
   * tree_digest: {
   * hash: "4a73bc9d03...",
   * size: 55
   * }
   * }
   * // Tree proto with hash "4a73bc9d03..." and size 55:
   * {
   * root: {
   * files: [
   * {
   * name: "bar",
   * digest: {
   * hash: "4a73bc9d03...",
   * size: 65534
   * }
   * }
   * ],
   * directories: [
   * {
   * name: "foo",
   * digest: {
   * hash: "4cf2eda940...",
   * size: 43
   * }
   * }
   * ]
   * }
   * children : {
   * // (Directory proto with hash "4cf2eda940..." and size 43)
   * files: [
   * {
   * name: "baz",
   * digest: {
   * hash: "b2c941073e...",
   * size: 1294,
   * },
   * is_executable: true
   * }
   * ]
   * }
   * }
   * ```
   * If an output of the same name was found, but was not a directory, the
   * server will return a FAILED_PRECONDITION.
   */
  'outputDirectories': (_build_bazel_remote_execution_v2_OutputDirectory__Output)[];
  /**
   * The exit code of the command.
   */
  'exitCode': (number);
  /**
   * The standard output buffer of the action. The server SHOULD NOT inline
   * stdout unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'stdoutRaw': (Buffer);
  /**
   * The digest for a blob containing the standard output of the action, which
   * can be retrieved from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'stdoutDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * The standard error buffer of the action. The server SHOULD NOT inline
   * stderr unless requested by the client in the
   * [GetActionResultRequest][build.bazel.remote.execution.v2.GetActionResultRequest]
   * message. The server MAY omit inlining, even if requested, and MUST do so if
   * inlining would cause the response to exceed message size limits.
   */
  'stderrRaw': (Buffer);
  /**
   * The digest for a blob containing the standard error of the action, which
   * can be retrieved from the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'stderrDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * The details of the execution that originally produced this result.
   */
  'executionMetadata': (_build_bazel_remote_execution_v2_ExecutedActionMetadata__Output | null);
  /**
   * The output files of the action that are symbolic links to other files.
   * Those may be links to other output files, or input files, or even absolute
   * paths outside of the working directory, if the server supports
   * [SymlinkAbsolutePathStrategy.ALLOWED][build.bazel.remote.execution.v2.CacheCapabilities.SymlinkAbsolutePathStrategy].
   * For each output file requested in the `output_files` field of the Action,
   * if the corresponding file existed after
   * the action completed, a single entry will be present either in this field,
   * or in the `output_files` field, if the file was not a symbolic link.
   * 
   * If an output symbolic link of the same name was found, but its target
   * type was not a regular file, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputFileSymlinks': (_build_bazel_remote_execution_v2_OutputSymlink__Output)[];
  /**
   * The output directories of the action that are symbolic links to other
   * directories. Those may be links to other output directories, or input
   * directories, or even absolute paths outside of the working directory,
   * if the server supports
   * [SymlinkAbsolutePathStrategy.ALLOWED][build.bazel.remote.execution.v2.CacheCapabilities.SymlinkAbsolutePathStrategy].
   * For each output directory requested in the `output_directories` field of
   * the Action, if the directory existed after the action completed, a
   * single entry will be present either in this field, or in the
   * `output_directories` field, if the directory was not a symbolic link.
   * 
   * If an output of the same name was found, but was a symbolic link to a file
   * instead of a directory, the server will return a FAILED_PRECONDITION.
   * If the action does not produce the requested output, then that output
   * will be omitted from the list. The server is free to arrange the output
   * list as desired; clients MUST NOT assume that the output list is sorted.
   */
  'outputDirectorySymlinks': (_build_bazel_remote_execution_v2_OutputSymlink__Output)[];
}
