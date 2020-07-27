// Original file: src/proto/stardoc_output/stardoc_output.proto


/**
 * GetModuleInfoRequest is consumed by the GetModuleInfo rpc.
 */
export interface GetModuleInfoRequest {
  /**
   * The name of the workspace to which the module belongs.  This is in the form
   * of a @-prefixed workspace name like '@io_bazel'.
   */
  'workspace_name'?: (string);
  /**
   * The release tag of the workspace.  This can either be a release tag or a
   * commit-id.
   */
  'release_name'?: (string);
  /**
   * The name of the module.  This is often the name of the .bzl file of the
   * top-level input for the stardoc compiler.
   */
  'module_name'?: (string);
}

/**
 * GetModuleInfoRequest is consumed by the GetModuleInfo rpc.
 */
export interface GetModuleInfoRequest__Output {
  /**
   * The name of the workspace to which the module belongs.  This is in the form
   * of a @-prefixed workspace name like '@io_bazel'.
   */
  'workspace_name': (string);
  /**
   * The release tag of the workspace.  This can either be a release tag or a
   * commit-id.
   */
  'release_name': (string);
  /**
   * The name of the module.  This is often the name of the .bzl file of the
   * top-level input for the stardoc compiler.
   */
  'module_name': (string);
}
