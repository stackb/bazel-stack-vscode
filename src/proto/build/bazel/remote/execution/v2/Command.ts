// Original file: proto/remote_execution.proto

import type {
  Platform as _build_bazel_remote_execution_v2_Platform,
  Platform__Output as _build_bazel_remote_execution_v2_Platform__Output,
} from '../../../../../build/bazel/remote/execution/v2/Platform';

/**
 * An `EnvironmentVariable` is one variable to set in the running program's
 * environment.
 */
export interface _build_bazel_remote_execution_v2_Command_EnvironmentVariable {
  /**
   * The variable name.
   */
  name?: string;
  /**
   * The variable value.
   */
  value?: string;
}

/**
 * An `EnvironmentVariable` is one variable to set in the running program's
 * environment.
 */
export interface _build_bazel_remote_execution_v2_Command_EnvironmentVariable__Output {
  /**
   * The variable name.
   */
  name: string;
  /**
   * The variable value.
   */
  value: string;
}

/**
 * A `Command` is the actual command executed by a worker running an
 * [Action][build.bazel.remote.execution.v2.Action] and specifications of its
 * environment.
 *
 * Except as otherwise required, the environment (such as which system
 * libraries or binaries are available, and what filesystems are mounted where)
 * is defined by and specific to the implementation of the remote execution API.
 */
export interface Command {
  /**
   * The arguments to the command. The first argument must be the path to the
   * executable, which must be either a relative path, in which case it is
   * evaluated with respect to the input root, or an absolute path.
   */
  arguments?: string[];
  /**
   * The environment variables to set when running the program. The worker may
   * provide its own default environment variables; these defaults can be
   * overridden using this field. Additional variables can also be specified.
   *
   * In order to ensure that equivalent
   * [Command][build.bazel.remote.execution.v2.Command]s always hash to the same
   * value, the environment variables MUST be lexicographically sorted by name.
   * Sorting of strings is done by code point, equivalently, by the UTF-8 bytes.
   */
  environmentVariables?: _build_bazel_remote_execution_v2_Command_EnvironmentVariable[];
  /**
   * A list of the output files that the client expects to retrieve from the
   * action. Only the listed files, as well as directories listed in
   * `output_directories`, will be returned to the client as output.
   * Other files or directories that may be created during command execution
   * are discarded.
   *
   * The paths are relative to the working directory of the action execution.
   * The paths are specified using a single forward slash (`/`) as a path
   * separator, even if the execution platform natively uses a different
   * separator. The path MUST NOT include a trailing slash, nor a leading slash,
   * being a relative path.
   *
   * In order to ensure consistent hashing of the same Action, the output paths
   * MUST be sorted lexicographically by code point (or, equivalently, by UTF-8
   * bytes).
   *
   * An output file cannot be duplicated, be a parent of another output file, or
   * have the same path as any of the listed output directories.
   *
   * Directories leading up to the output files are created by the worker prior
   * to execution, even if they are not explicitly part of the input root.
   */
  outputFiles?: string[];
  /**
   * A list of the output directories that the client expects to retrieve from
   * the action. Only the listed directories will be returned (an entire
   * directory structure will be returned as a
   * [Tree][build.bazel.remote.execution.v2.Tree] message digest, see
   * [OutputDirectory][build.bazel.remote.execution.v2.OutputDirectory]), as
   * well as files listed in `output_files`. Other files or directories that
   * may be created during command execution are discarded.
   *
   * The paths are relative to the working directory of the action execution.
   * The paths are specified using a single forward slash (`/`) as a path
   * separator, even if the execution platform natively uses a different
   * separator. The path MUST NOT include a trailing slash, nor a leading slash,
   * being a relative path. The special value of empty string is allowed,
   * although not recommended, and can be used to capture the entire working
   * directory tree, including inputs.
   *
   * In order to ensure consistent hashing of the same Action, the output paths
   * MUST be sorted lexicographically by code point (or, equivalently, by UTF-8
   * bytes).
   *
   * An output directory cannot be duplicated or have the same path as any of
   * the listed output files. An output directory is allowed to be a parent of
   * another output directory.
   *
   * Directories leading up to the output directories (but not the output
   * directories themselves) are created by the worker prior to execution, even
   * if they are not explicitly part of the input root.
   */
  outputDirectories?: string[];
  /**
   * The platform requirements for the execution environment. The server MAY
   * choose to execute the action on any worker satisfying the requirements, so
   * the client SHOULD ensure that running the action on any such worker will
   * have the same result.
   * A detailed lexicon for this can be found in the accompanying platform.md.
   */
  platform?: _build_bazel_remote_execution_v2_Platform | null;
  /**
   * The working directory, relative to the input root, for the command to run
   * in. It must be a directory which exists in the input tree. If it is left
   * empty, then the action is run in the input root.
   */
  workingDirectory?: string;
}

/**
 * A `Command` is the actual command executed by a worker running an
 * [Action][build.bazel.remote.execution.v2.Action] and specifications of its
 * environment.
 *
 * Except as otherwise required, the environment (such as which system
 * libraries or binaries are available, and what filesystems are mounted where)
 * is defined by and specific to the implementation of the remote execution API.
 */
export interface Command__Output {
  /**
   * The arguments to the command. The first argument must be the path to the
   * executable, which must be either a relative path, in which case it is
   * evaluated with respect to the input root, or an absolute path.
   */
  arguments: string[];
  /**
   * The environment variables to set when running the program. The worker may
   * provide its own default environment variables; these defaults can be
   * overridden using this field. Additional variables can also be specified.
   *
   * In order to ensure that equivalent
   * [Command][build.bazel.remote.execution.v2.Command]s always hash to the same
   * value, the environment variables MUST be lexicographically sorted by name.
   * Sorting of strings is done by code point, equivalently, by the UTF-8 bytes.
   */
  environmentVariables: _build_bazel_remote_execution_v2_Command_EnvironmentVariable__Output[];
  /**
   * A list of the output files that the client expects to retrieve from the
   * action. Only the listed files, as well as directories listed in
   * `output_directories`, will be returned to the client as output.
   * Other files or directories that may be created during command execution
   * are discarded.
   *
   * The paths are relative to the working directory of the action execution.
   * The paths are specified using a single forward slash (`/`) as a path
   * separator, even if the execution platform natively uses a different
   * separator. The path MUST NOT include a trailing slash, nor a leading slash,
   * being a relative path.
   *
   * In order to ensure consistent hashing of the same Action, the output paths
   * MUST be sorted lexicographically by code point (or, equivalently, by UTF-8
   * bytes).
   *
   * An output file cannot be duplicated, be a parent of another output file, or
   * have the same path as any of the listed output directories.
   *
   * Directories leading up to the output files are created by the worker prior
   * to execution, even if they are not explicitly part of the input root.
   */
  outputFiles: string[];
  /**
   * A list of the output directories that the client expects to retrieve from
   * the action. Only the listed directories will be returned (an entire
   * directory structure will be returned as a
   * [Tree][build.bazel.remote.execution.v2.Tree] message digest, see
   * [OutputDirectory][build.bazel.remote.execution.v2.OutputDirectory]), as
   * well as files listed in `output_files`. Other files or directories that
   * may be created during command execution are discarded.
   *
   * The paths are relative to the working directory of the action execution.
   * The paths are specified using a single forward slash (`/`) as a path
   * separator, even if the execution platform natively uses a different
   * separator. The path MUST NOT include a trailing slash, nor a leading slash,
   * being a relative path. The special value of empty string is allowed,
   * although not recommended, and can be used to capture the entire working
   * directory tree, including inputs.
   *
   * In order to ensure consistent hashing of the same Action, the output paths
   * MUST be sorted lexicographically by code point (or, equivalently, by UTF-8
   * bytes).
   *
   * An output directory cannot be duplicated or have the same path as any of
   * the listed output files. An output directory is allowed to be a parent of
   * another output directory.
   *
   * Directories leading up to the output directories (but not the output
   * directories themselves) are created by the worker prior to execution, even
   * if they are not explicitly part of the input root.
   */
  outputDirectories: string[];
  /**
   * The platform requirements for the execution environment. The server MAY
   * choose to execute the action on any worker satisfying the requirements, so
   * the client SHOULD ensure that running the action on any such worker will
   * have the same result.
   * A detailed lexicon for this can be found in the accompanying platform.md.
   */
  platform: _build_bazel_remote_execution_v2_Platform__Output | null;
  /**
   * The working directory, relative to the input root, for the command to run
   * in. It must be a directory which exists in the input tree. If it is left
   * empty, then the action is run in the input root.
   */
  workingDirectory: string;
}
