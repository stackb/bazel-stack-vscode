// Original file: proto/remote_execution.proto

import type {
  Timestamp as _google_protobuf_Timestamp,
  Timestamp__Output as _google_protobuf_Timestamp__Output,
} from '../../../../../google/protobuf/Timestamp';

/**
 * ExecutedActionMetadata contains details about a completed execution.
 */
export interface ExecutedActionMetadata {
  /**
   * The name of the worker which ran the execution.
   */
  worker?: string;
  /**
   * When was the action added to the queue.
   */
  queuedTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker received the action.
   */
  workerStartTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker completed the action, including all stages.
   */
  workerCompletedTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker started fetching action inputs.
   */
  inputFetchStartTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker finished fetching action inputs.
   */
  inputFetchCompletedTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker started executing the action command.
   */
  executionStartTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker completed executing the action command.
   */
  executionCompletedTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker started uploading action outputs.
   */
  outputUploadStartTimestamp?: _google_protobuf_Timestamp | null;
  /**
   * When the worker finished uploading action outputs.
   */
  outputUploadCompletedTimestamp?: _google_protobuf_Timestamp | null;
}

/**
 * ExecutedActionMetadata contains details about a completed execution.
 */
export interface ExecutedActionMetadata__Output {
  /**
   * The name of the worker which ran the execution.
   */
  worker: string;
  /**
   * When was the action added to the queue.
   */
  queuedTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker received the action.
   */
  workerStartTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker completed the action, including all stages.
   */
  workerCompletedTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker started fetching action inputs.
   */
  inputFetchStartTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker finished fetching action inputs.
   */
  inputFetchCompletedTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker started executing the action command.
   */
  executionStartTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker completed executing the action command.
   */
  executionCompletedTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker started uploading action outputs.
   */
  outputUploadStartTimestamp: _google_protobuf_Timestamp__Output | null;
  /**
   * When the worker finished uploading action outputs.
   */
  outputUploadCompletedTimestamp: _google_protobuf_Timestamp__Output | null;
}
