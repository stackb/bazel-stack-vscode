// Original file: proto/failure_details.proto

// Original file: proto/failure_details.proto

export enum _failure_details_RemoteOptions_Code {
  REMOTE_OPTIONS_UNKNOWN = 0,
  REMOTE_DEFAULT_EXEC_PROPERTIES_LOGIC_ERROR = 1,
  /**
   * Credentials could not be read from the requested file/socket/process/etc.
   */
  CREDENTIALS_READ_FAILURE = 2,
  /**
   * Credentials could not be written to a shared, temporary file.
   */
  CREDENTIALS_WRITE_FAILURE = 3,
  DOWNLOADER_WITHOUT_GRPC_CACHE = 4,
  EXECUTION_WITH_INVALID_CACHE = 5,
}

export interface RemoteOptions {
  code?: _failure_details_RemoteOptions_Code | keyof typeof _failure_details_RemoteOptions_Code;
}

export interface RemoteOptions__Output {
  code: _failure_details_RemoteOptions_Code;
}
