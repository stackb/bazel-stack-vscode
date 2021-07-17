// Original file: proto/bzl.proto

import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';

export interface CancelRequest {
  workspace?: _build_stack_bezel_v1beta1_Workspace | null;
  commandId?: string;
}

export interface CancelRequest__Output {
  workspace: _build_stack_bezel_v1beta1_Workspace__Output | null;
  commandId: string;
}
