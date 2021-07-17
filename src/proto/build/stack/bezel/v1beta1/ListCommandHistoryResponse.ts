// Original file: proto/bzl.proto

import type {
  CommandHistory as _build_stack_bezel_v1beta1_CommandHistory,
  CommandHistory__Output as _build_stack_bezel_v1beta1_CommandHistory__Output,
} from '../../../../build/stack/bezel/v1beta1/CommandHistory';

export interface ListCommandHistoryResponse {
  history?: _build_stack_bezel_v1beta1_CommandHistory[];
}

export interface ListCommandHistoryResponse__Output {
  history: _build_stack_bezel_v1beta1_CommandHistory__Output[];
}
