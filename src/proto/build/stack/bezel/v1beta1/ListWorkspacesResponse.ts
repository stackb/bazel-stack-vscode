// Original file: proto/bzl.proto

import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';

/**
 * ListWorkspacesResponse is produced by the WorkspaceService.List rpc.
 */
export interface ListWorkspacesResponse {
  /**
   * ListWorkspacesResponse is produced by the WorkspaceService.List rpc.
   */
  workspace?: _build_stack_bezel_v1beta1_Workspace[];
}

/**
 * ListWorkspacesResponse is produced by the WorkspaceService.List rpc.
 */
export interface ListWorkspacesResponse__Output {
  /**
   * ListWorkspacesResponse is produced by the WorkspaceService.List rpc.
   */
  workspace: _build_stack_bezel_v1beta1_Workspace__Output[];
}
