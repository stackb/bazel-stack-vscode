// Original file: proto/build_event_stream.proto


/**
 * Payload of an event reporting the command-line of the invocation as
 * originally received by the server. Note that this is not the command-line
 * given by the user, as the client adds information about the invocation,
 * like name and relevant entries of rc-files and client environment variables.
 * However, it does contain enough information to reproduce the build
 * invocation.
 */
export interface UnstructuredCommandLine {
  /**
   * Payload of an event reporting the command-line of the invocation as
   * originally received by the server. Note that this is not the command-line
   * given by the user, as the client adds information about the invocation,
   * like name and relevant entries of rc-files and client environment variables.
   * However, it does contain enough information to reproduce the build
   * invocation.
   */
  'args'?: (string)[];
}

/**
 * Payload of an event reporting the command-line of the invocation as
 * originally received by the server. Note that this is not the command-line
 * given by the user, as the client adds information about the invocation,
 * like name and relevant entries of rc-files and client environment variables.
 * However, it does contain enough information to reproduce the build
 * invocation.
 */
export interface UnstructuredCommandLine__Output {
  /**
   * Payload of an event reporting the command-line of the invocation as
   * originally received by the server. Note that this is not the command-line
   * given by the user, as the client adds information about the invocation,
   * like name and relevant entries of rc-files and client environment variables.
   * However, it does contain enough information to reproduce the build
   * invocation.
   */
  'args': (string)[];
}
