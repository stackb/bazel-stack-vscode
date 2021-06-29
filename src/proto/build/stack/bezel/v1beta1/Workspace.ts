// Original file: proto/bzl.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';

/**
 * Workspace represents a local bazel repository
 */
export interface Workspace {
  /**
   * Path to the output_path
   */
  'outputBase'?: (string);
  /**
   * Id of the workspace (example: 01fa2f41eb57135eccbb39c05adce50f)
   */
  'id'?: (string);
  /**
   * The process ID
   */
  'pid'?: (number);
  /**
   * The server command line
   */
  'commandLine'?: (string)[];
  /**
   * The command port
   */
  'commandPort'?: (string);
  /**
   * The request cookie
   */
  'requestCookie'?: (string);
  /**
   * The response cookie
   */
  'responseCookie'?: (string);
  /**
   * The server start time
   */
  'startTime'?: (_google_protobuf_Timestamp);
  /**
   * The working directory
   */
  'cwd'?: (string);
  /**
   * The name of the workspace, parsed from the WORKSPACE file
   */
  'name'?: (string);
  /**
   * The base_name of cwd
   */
  'baseName'?: (string);
  /**
   * The default version of bazel to use
   */
  'bazelVersion'?: (string);
  /**
   * Path to the bazel binary that should be used for this workspace.  It is
   * either based on the version, or an override value.
   */
  'bazelBinary'?: (string);
  /**
   * If this is a tombstone (cwd does not exist)
   */
  'tombstone'?: (boolean);
  /**
   * The default configuration that was selected by the user
   */
  'defaultConfiguration'?: (string);
  /**
   * The users home dir
   */
  'homeDir'?: (string);
  /**
   * the startup options
   */
  'startupOptions'?: (Buffer | Uint8Array | string)[];
  /**
   * The local exec root
   */
  'localExecRoot'?: (string);
  /**
   * The cwd, always forward slashed and drive letter uppercased.
   */
  'normalizedCwd'?: (string);
}

/**
 * Workspace represents a local bazel repository
 */
export interface Workspace__Output {
  /**
   * Path to the output_path
   */
  'outputBase': (string);
  /**
   * Id of the workspace (example: 01fa2f41eb57135eccbb39c05adce50f)
   */
  'id': (string);
  /**
   * The process ID
   */
  'pid': (number);
  /**
   * The server command line
   */
  'commandLine': (string)[];
  /**
   * The command port
   */
  'commandPort': (string);
  /**
   * The request cookie
   */
  'requestCookie': (string);
  /**
   * The response cookie
   */
  'responseCookie': (string);
  /**
   * The server start time
   */
  'startTime'?: (_google_protobuf_Timestamp__Output);
  /**
   * The working directory
   */
  'cwd': (string);
  /**
   * The name of the workspace, parsed from the WORKSPACE file
   */
  'name': (string);
  /**
   * The base_name of cwd
   */
  'baseName': (string);
  /**
   * The default version of bazel to use
   */
  'bazelVersion': (string);
  /**
   * Path to the bazel binary that should be used for this workspace.  It is
   * either based on the version, or an override value.
   */
  'bazelBinary': (string);
  /**
   * If this is a tombstone (cwd does not exist)
   */
  'tombstone': (boolean);
  /**
   * The default configuration that was selected by the user
   */
  'defaultConfiguration': (string);
  /**
   * The users home dir
   */
  'homeDir': (string);
  /**
   * the startup options
   */
  'startupOptions': (Buffer)[];
  /**
   * The local exec root
   */
  'localExecRoot': (string);
  /**
   * The cwd, always forward slashed and drive letter uppercased.
   */
  'normalizedCwd': (string);
}
