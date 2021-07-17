// Original file: proto/remote_execution.proto

import type {
  Digest as _build_bazel_remote_execution_v2_Digest,
  Digest__Output as _build_bazel_remote_execution_v2_Digest__Output,
} from '../../../../../build/bazel/remote/execution/v2/Digest';

/**
 * A `LogFile` is a log stored in the CAS.
 */
export interface LogFile {
  /**
   * The digest of the log contents.
   */
  digest?: _build_bazel_remote_execution_v2_Digest | null;
  /**
   * This is a hint as to the purpose of the log, and is set to true if the log
   * is human-readable text that can be usefully displayed to a user, and false
   * otherwise. For instance, if a command-line client wishes to print the
   * server logs to the terminal for a failed action, this allows it to avoid
   * displaying a binary file.
   */
  humanReadable?: boolean;
}

/**
 * A `LogFile` is a log stored in the CAS.
 */
export interface LogFile__Output {
  /**
   * The digest of the log contents.
   */
  digest: _build_bazel_remote_execution_v2_Digest__Output | null;
  /**
   * This is a hint as to the purpose of the log, and is set to true if the log
   * is human-readable text that can be usefully displayed to a user, and false
   * otherwise. For instance, if a command-line client wishes to print the
   * server logs to the terminal for a failed action, this allows it to avoid
   * displaying a binary file.
   */
  humanReadable: boolean;
}
