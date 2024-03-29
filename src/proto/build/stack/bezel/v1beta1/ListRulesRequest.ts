// Original file: proto/bzl.proto

import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';
import type {
  ExternalWorkspace as _build_stack_bezel_v1beta1_ExternalWorkspace,
  ExternalWorkspace__Output as _build_stack_bezel_v1beta1_ExternalWorkspace__Output,
} from '../../../../build/stack/bezel/v1beta1/ExternalWorkspace';
import type {
  Package as _build_stack_bezel_v1beta1_Package,
  Package__Output as _build_stack_bezel_v1beta1_Package__Output,
} from '../../../../build/stack/bezel/v1beta1/Package';

export interface ListRulesRequest {
  /**
   * Mandatory workspace to target
   */
  workspace?: _build_stack_bezel_v1beta1_Workspace | null;
  /**
   * Optional external workspace to constrain
   */
  externalWorkspace?: _build_stack_bezel_v1beta1_ExternalWorkspace | null;
  /**
   * Optional package to constrain
   */
  package?: _build_stack_bezel_v1beta1_Package | null;
  /**
   * If the request should be recursive
   */
  recursive?: boolean;
}

export interface ListRulesRequest__Output {
  /**
   * Mandatory workspace to target
   */
  workspace: _build_stack_bezel_v1beta1_Workspace__Output | null;
  /**
   * Optional external workspace to constrain
   */
  externalWorkspace: _build_stack_bezel_v1beta1_ExternalWorkspace__Output | null;
  /**
   * Optional package to constrain
   */
  package: _build_stack_bezel_v1beta1_Package__Output | null;
  /**
   * If the request should be recursive
   */
  recursive: boolean;
}
