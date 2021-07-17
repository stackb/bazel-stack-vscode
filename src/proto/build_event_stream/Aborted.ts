// Original file: proto/build_event_stream.proto

// Original file: proto/build_event_stream.proto

export enum _build_event_stream_Aborted_AbortReason {
  UNKNOWN = 0,
  /**
   * The user requested the build to be aborted (e.g., by hitting Ctl-C).
   */
  USER_INTERRUPTED = 1,
  /**
   * The user requested that no analysis be performed.
   */
  NO_ANALYZE = 8,
  /**
   * The user requested that no build be carried out.
   */
  NO_BUILD = 9,
  /**
   * The build or target was aborted as a timeout was exceeded.
   */
  TIME_OUT = 2,
  /**
   * The build or target was aborted as some remote environment (e.g., for
   * remote execution of actions) was not available in the expected way.
   */
  REMOTE_ENVIRONMENT_FAILURE = 3,
  /**
   * Failure due to reasons entirely internal to the build tool, e.g.,
   * running out of memory.
   */
  INTERNAL = 4,
  /**
   * A Failure occurred in the loading phase of a target.
   */
  LOADING_FAILURE = 5,
  /**
   * A Failure occurred in the analysis phase of a target.
   */
  ANALYSIS_FAILURE = 6,
  /**
   * Target build was skipped (e.g. due to incompatible CPU constraints).
   */
  SKIPPED = 7,
  /**
   * Build incomplete due to an earlier build failure (e.g. --keep_going was
   * set to false causing the build be ended upon failure).
   */
  INCOMPLETE = 10,
}

/**
 * Payload of an event indicating that an expected event will not come, as
 * the build is aborted prematurely for some reason.
 */
export interface Aborted {
  reason?:
    | _build_event_stream_Aborted_AbortReason
    | keyof typeof _build_event_stream_Aborted_AbortReason;
  /**
   * A human readable description with more details about there reason, where
   * available and useful.
   */
  description?: string;
}

/**
 * Payload of an event indicating that an expected event will not come, as
 * the build is aborted prematurely for some reason.
 */
export interface Aborted__Output {
  reason: _build_event_stream_Aborted_AbortReason;
  /**
   * A human readable description with more details about there reason, where
   * available and useful.
   */
  description: string;
}
