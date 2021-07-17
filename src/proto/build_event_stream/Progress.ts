// Original file: proto/build_event_stream.proto

/**
 * Payload of an event summarizing the progress of the build so far. Those
 * events are also used to be parents of events where the more logical parent
 * event cannot be posted yet as the needed information is not yet complete.
 */
export interface Progress {
  /**
   * The next chunk of stdout that bazel produced since the last progress event
   * or the beginning of the build.
   */
  stdout?: string;
  /**
   * The next chunk of stderr that bazel produced since the last progress event
   * or the beginning of the build.
   */
  stderr?: string;
}

/**
 * Payload of an event summarizing the progress of the build so far. Those
 * events are also used to be parents of events where the more logical parent
 * event cannot be posted yet as the needed information is not yet complete.
 */
export interface Progress__Output {
  /**
   * The next chunk of stdout that bazel produced since the last progress event
   * or the beginning of the build.
   */
  stdout: string;
  /**
   * The next chunk of stderr that bazel produced since the last progress event
   * or the beginning of the build.
   */
  stderr: string;
}
