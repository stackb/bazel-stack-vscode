// Original file: proto/build_event_stream.proto

export enum TestStatus {
  NO_STATUS = 0,
  PASSED = 1,
  FLAKY = 2,
  TIMEOUT = 3,
  FAILED = 4,
  INCOMPLETE = 5,
  REMOTE_FAILURE = 6,
  FAILED_TO_BUILD = 7,
  TOOL_HALTED_BEFORE_TESTING = 8,
}
