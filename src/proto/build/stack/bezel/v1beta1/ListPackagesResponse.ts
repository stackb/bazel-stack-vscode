// Original file: proto/bzl.proto

import type { Package as _build_stack_bezel_v1beta1_Package, Package__Output as _build_stack_bezel_v1beta1_Package__Output } from '../../../../build/stack/bezel/v1beta1/Package';

export interface ListPackagesResponse {
  /**
   * Returns a List of packages
   */
  'package'?: (_build_stack_bezel_v1beta1_Package)[];
}

export interface ListPackagesResponse__Output {
  /**
   * Returns a List of packages
   */
  'package': (_build_stack_bezel_v1beta1_Package__Output)[];
}
