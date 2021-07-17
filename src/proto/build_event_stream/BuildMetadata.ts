// Original file: proto/build_event_stream.proto

/**
 * Payload of an event reporting custom key-value metadata associated with the
 * build.
 */
export interface BuildMetadata {
  /**
   * Custom metadata for the build.
   */
  metadata?: { [key: string]: string };
}

/**
 * Payload of an event reporting custom key-value metadata associated with the
 * build.
 */
export interface BuildMetadata__Output {
  /**
   * Custom metadata for the build.
   */
  metadata: { [key: string]: string };
}
