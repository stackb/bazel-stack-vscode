// Original file: proto/failure_details.proto

import type {
  Throwable as _failure_details_Throwable,
  Throwable__Output as _failure_details_Throwable__Output,
} from '../failure_details/Throwable';

// Original file: proto/failure_details.proto

export enum _failure_details_Crash_Code {
  CRASH_UNKNOWN = 0,
  CRASH_OOM = 1,
}

export interface Crash {
  code?: _failure_details_Crash_Code | keyof typeof _failure_details_Crash_Code;
  /**
   * The cause chain of the crash, with the outermost throwable first. Limited
   * to the outermost exception and at most 4 nested causes (so, max size of 5).
   */
  causes?: _failure_details_Throwable[];
}

export interface Crash__Output {
  code: _failure_details_Crash_Code;
  /**
   * The cause chain of the crash, with the outermost throwable first. Limited
   * to the outermost exception and at most 4 nested causes (so, max size of 5).
   */
  causes: _failure_details_Throwable__Output[];
}
