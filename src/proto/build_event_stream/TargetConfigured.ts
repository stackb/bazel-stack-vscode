// Original file: proto/build_event_stream.proto

import { TestSize as _build_event_stream_TestSize } from '../build_event_stream/TestSize';

/**
 * Payload of the event indicating that the configurations for a target have
 * been identified. As with pattern expansion the main information is in the
 * chaining part: the id will contain the target that was configured and the
 * children id will contain the configured targets it was configured to.
 */
export interface TargetConfigured {
  /**
   * The kind of target (e.g.,  e.g. "cc_library rule", "source file",
   * "generated file") where the completion is reported.
   */
  'targetKind'?: (string);
  /**
   * The size of the test, if the target is a test target. Unset otherwise.
   */
  'testSize'?: (_build_event_stream_TestSize | keyof typeof _build_event_stream_TestSize);
  /**
   * List of all tags associated with this target (for all possible
   * configurations).
   */
  'tag'?: (string)[];
}

/**
 * Payload of the event indicating that the configurations for a target have
 * been identified. As with pattern expansion the main information is in the
 * chaining part: the id will contain the target that was configured and the
 * children id will contain the configured targets it was configured to.
 */
export interface TargetConfigured__Output {
  /**
   * The kind of target (e.g.,  e.g. "cc_library rule", "source file",
   * "generated file") where the completion is reported.
   */
  'targetKind': (string);
  /**
   * The size of the test, if the target is a test target. Unset otherwise.
   */
  'testSize': (_build_event_stream_TestSize);
  /**
   * List of all tags associated with this target (for all possible
   * configurations).
   */
  'tag': (string)[];
}
