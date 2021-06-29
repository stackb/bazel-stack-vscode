// Original file: proto/build_event_stream.proto


/**
 * Configuration related to the blaze workspace and output tree.
 */
export interface WorkspaceConfig {
  /**
   * The root of the local blaze exec root. All output files live underneath
   * this at "blaze-out/".
   */
  'localExecRoot'?: (string);
}

/**
 * Configuration related to the blaze workspace and output tree.
 */
export interface WorkspaceConfig__Output {
  /**
   * The root of the local blaze exec root. All output files live underneath
   * this at "blaze-out/".
   */
  'localExecRoot': (string);
}
