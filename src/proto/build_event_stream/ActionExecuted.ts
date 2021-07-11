// Original file: proto/build_event_stream.proto

import type { File as _build_event_stream_File, File__Output as _build_event_stream_File__Output } from '../build_event_stream/File';
import type { _build_event_stream_BuildEventId_ConfigurationId, _build_event_stream_BuildEventId_ConfigurationId__Output } from '../build_event_stream/BuildEventId';
import type { FailureDetail as _failure_details_FailureDetail, FailureDetail__Output as _failure_details_FailureDetail__Output } from '../failure_details/FailureDetail';

/**
 * Payload of the event indicating the completion of an action. The main purpose
 * of posting those events is to provide details on the root cause for a target
 * failing; however, consumers of the build-event protocol must not assume
 * that only failed actions are posted.
 */
export interface ActionExecuted {
  'success'?: (boolean);
  /**
   * The exit code of the action, if it is available.
   */
  'exitCode'?: (number);
  /**
   * Location where to find the standard output of the action
   * (e.g., a file path).
   */
  'stdout'?: (_build_event_stream_File | null);
  /**
   * Location where to find the standard error of the action
   * (e.g., a file path).
   */
  'stderr'?: (_build_event_stream_File | null);
  /**
   * Deprecated. This field is now present on ActionCompletedId.
   */
  'label'?: (string);
  /**
   * Primary output; only provided for successful actions.
   */
  'primaryOutput'?: (_build_event_stream_File | null);
  /**
   * Deprecated. This field is now present on ActionCompletedId.
   */
  'configuration'?: (_build_event_stream_BuildEventId_ConfigurationId | null);
  /**
   * The mnemonic of the action that was executed
   */
  'type'?: (string);
  /**
   * The command-line of the action, if the action is a command.
   */
  'commandLine'?: (string)[];
  /**
   * List of paths to log files
   */
  'actionMetadataLogs'?: (_build_event_stream_File)[];
  /**
   * Only populated if success = false, and sometimes not even then.
   */
  'failureDetail'?: (_failure_details_FailureDetail | null);
}

/**
 * Payload of the event indicating the completion of an action. The main purpose
 * of posting those events is to provide details on the root cause for a target
 * failing; however, consumers of the build-event protocol must not assume
 * that only failed actions are posted.
 */
export interface ActionExecuted__Output {
  'success': (boolean);
  /**
   * The exit code of the action, if it is available.
   */
  'exitCode': (number);
  /**
   * Location where to find the standard output of the action
   * (e.g., a file path).
   */
  'stdout': (_build_event_stream_File__Output | null);
  /**
   * Location where to find the standard error of the action
   * (e.g., a file path).
   */
  'stderr': (_build_event_stream_File__Output | null);
  /**
   * Deprecated. This field is now present on ActionCompletedId.
   */
  'label': (string);
  /**
   * Primary output; only provided for successful actions.
   */
  'primaryOutput': (_build_event_stream_File__Output | null);
  /**
   * Deprecated. This field is now present on ActionCompletedId.
   */
  'configuration': (_build_event_stream_BuildEventId_ConfigurationId__Output | null);
  /**
   * The mnemonic of the action that was executed
   */
  'type': (string);
  /**
   * The command-line of the action, if the action is a command.
   */
  'commandLine': (string)[];
  /**
   * List of paths to log files
   */
  'actionMetadataLogs': (_build_event_stream_File__Output)[];
  /**
   * Only populated if success = false, and sometimes not even then.
   */
  'failureDetail': (_failure_details_FailureDetail__Output | null);
}
