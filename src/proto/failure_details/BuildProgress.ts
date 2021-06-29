// Original file: proto/failure_details.proto

// Original file: proto/failure_details.proto

export enum _failure_details_BuildProgress_Code {
  BUILD_PROGRESS_UNKNOWN = 0,
  OUTPUT_INITIALIZATION = 3,
  BES_RUNS_PER_TEST_LIMIT_UNSUPPORTED = 4,
  BES_LOCAL_WRITE_ERROR = 5,
  BES_INITIALIZATION_ERROR = 6,
  BES_UPLOAD_TIMEOUT_ERROR = 7,
  BES_FILE_WRITE_TIMEOUT = 8,
  BES_FILE_WRITE_IO_ERROR = 9,
  BES_FILE_WRITE_INTERRUPTED = 10,
  BES_FILE_WRITE_CANCELED = 11,
  BES_FILE_WRITE_UNKNOWN_ERROR = 12,
  BES_UPLOAD_LOCAL_FILE_ERROR = 13,
  BES_STREAM_NOT_RETRYING_FAILURE = 14,
  BES_STREAM_COMPLETED_WITH_UNACK_EVENTS_ERROR = 15,
  BES_STREAM_COMPLETED_WITH_UNSENT_EVENTS_ERROR = 16,
  BES_UPLOAD_RETRY_LIMIT_EXCEEDED_FAILURE = 17,
}

export interface BuildProgress {
  code?: _failure_details_BuildProgress_Code | keyof typeof _failure_details_BuildProgress_Code;
}

export interface BuildProgress__Output {
  code: _failure_details_BuildProgress_Code;
}
