// Original file: proto/bzl.proto


/**
 * ListWorkspacesRequest is consumed by the WorkspaceService.List rpc.
 */
export interface ListWorkspacesRequest {
  /**
   * the server may cache the discovered workspaces.  This option forces it
   * not to use the cache.
   */
  'refresh'?: (boolean);
}

/**
 * ListWorkspacesRequest is consumed by the WorkspaceService.List rpc.
 */
export interface ListWorkspacesRequest__Output {
  /**
   * the server may cache the discovered workspaces.  This option forces it
   * not to use the cache.
   */
  'refresh': (boolean);
}
