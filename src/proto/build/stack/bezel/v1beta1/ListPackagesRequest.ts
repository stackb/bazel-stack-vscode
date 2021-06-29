// Original file: proto/bzl.proto

import type {
  Workspace as _build_stack_bezel_v1beta1_Workspace,
  Workspace__Output as _build_stack_bezel_v1beta1_Workspace__Output,
} from '../../../../build/stack/bezel/v1beta1/Workspace';
import type {
  ExternalWorkspace as _build_stack_bezel_v1beta1_ExternalWorkspace,
  ExternalWorkspace__Output as _build_stack_bezel_v1beta1_ExternalWorkspace__Output,
} from '../../../../build/stack/bezel/v1beta1/ExternalWorkspace';

export interface ListPackagesRequest {
  workspace?: _build_stack_bezel_v1beta1_Workspace;
  externalWorkspace?: _build_stack_bezel_v1beta1_ExternalWorkspace;
}

export interface ListPackagesRequest__Output {
  workspace?: _build_stack_bezel_v1beta1_Workspace__Output;
  externalWorkspace?: _build_stack_bezel_v1beta1_ExternalWorkspace__Output;
}
