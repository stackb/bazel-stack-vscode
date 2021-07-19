// Original file: proto/bzl.proto

// Original file: proto/bzl.proto

export enum _build_stack_bezel_v1beta1_LabelKind_Type {
  UNKNOWN_TYPE = 0,
  RULE = 1,
  SOURCE_FILE = 2,
  GENERATED_FILE = 3,
}

export interface LabelKind {
  type?:
    | _build_stack_bezel_v1beta1_LabelKind_Type
    | keyof typeof _build_stack_bezel_v1beta1_LabelKind_Type;
  kind?: string;
  label?: string;
  location?: string;
}

export interface LabelKind__Output {
  type: _build_stack_bezel_v1beta1_LabelKind_Type;
  kind: string;
  label: string;
  location: string;
}
