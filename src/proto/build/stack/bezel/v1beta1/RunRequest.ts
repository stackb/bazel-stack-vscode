// Original file: proto/bzl.proto

import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';

export interface RunRequest {
  workspace?: _build_stack_bezel_v1beta1_Workspace;
  /**
   * Additional arguments/options for the command.
   */
  arg?: string[];
  /**
   * If true, include action events
   */
  actionEvents?: boolean;
  /**
   * Optional environment variables of the form KEY=VAL
   */
  env?: string[];
}

export interface RunRequest__Output {
  workspace?: _build_stack_bezel_v1beta1_Workspace__Output;
  /**
   * Additional arguments/options for the command.
   */
  arg: string[];
  /**
   * If true, include action events
   */
  actionEvents: boolean;
  /**
   * Optional environment variables of the form KEY=VAL
   */
  env: string[];
}
