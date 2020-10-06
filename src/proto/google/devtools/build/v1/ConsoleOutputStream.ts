// Original file: proto/build_events.proto

/**
 * The type of console output stream.
 */
export enum ConsoleOutputStream {
  /**
   * Unspecified or unknown.
   */
  UNKNOWN = 0,
  /**
   * Normal output stream.
   */
  STDOUT = 1,
  /**
   * Error output stream.
   */
  STDERR = 2,
}
