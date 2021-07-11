// Original file: proto/remote_execution.proto


/**
 * A request message for
 * [Capabilities.GetCapabilities][build.bazel.remote.execution.v2.Capabilities.GetCapabilities].
 */
export interface GetCapabilitiesRequest {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName'?: (string);
}

/**
 * A request message for
 * [Capabilities.GetCapabilities][build.bazel.remote.execution.v2.Capabilities.GetCapabilities].
 */
export interface GetCapabilitiesRequest__Output {
  /**
   * The instance of the execution system to operate against. A server may
   * support multiple instances of the execution system (with their own workers,
   * storage, caches, etc.). The server MAY require use of this field to select
   * between them in an implementation-defined fashion, otherwise it can be
   * omitted.
   */
  'instanceName': (string);
}
