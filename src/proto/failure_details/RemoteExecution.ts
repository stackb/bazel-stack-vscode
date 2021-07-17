// Original file: proto/failure_details.proto

// Original file: proto/failure_details.proto

/**
 * The association of some of these options with exit code 2, "command line
 * error", seems sketchy. Especially worth reconsidering are the channel init
 * failure modes, which can correspond to failures occurring in gRPC setup.
 * These all correspond with current Bazel behavior.
 */
export enum _failure_details_RemoteExecution_Code {
  REMOTE_EXECUTION_UNKNOWN = 0,
  CAPABILITIES_QUERY_FAILURE = 1,
  CREDENTIALS_INIT_FAILURE = 2,
  CACHE_INIT_FAILURE = 3,
  RPC_LOG_FAILURE = 4,
  EXEC_CHANNEL_INIT_FAILURE = 5,
  CACHE_CHANNEL_INIT_FAILURE = 6,
  DOWNLOADER_CHANNEL_INIT_FAILURE = 7,
  LOG_DIR_CLEANUP_FAILURE = 8,
  CLIENT_SERVER_INCOMPATIBLE = 9,
  DOWNLOADED_INPUTS_DELETION_FAILURE = 10,
}

export interface RemoteExecution {
  code?: _failure_details_RemoteExecution_Code | keyof typeof _failure_details_RemoteExecution_Code;
}

export interface RemoteExecution__Output {
  code: _failure_details_RemoteExecution_Code;
}
