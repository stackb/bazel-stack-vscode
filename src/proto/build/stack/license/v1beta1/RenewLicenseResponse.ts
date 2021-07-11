// Original file: proto/license.proto

import type { License as _build_stack_license_v1beta1_License, License__Output as _build_stack_license_v1beta1_License__Output } from '../../../../build/stack/license/v1beta1/License';

export interface RenewLicenseResponse {
  /**
   * a JWT token that encodes the user identity and new license metadata.
   */
  'newToken'?: (string);
  'license'?: (_build_stack_license_v1beta1_License | null);
}

export interface RenewLicenseResponse__Output {
  /**
   * a JWT token that encodes the user identity and new license metadata.
   */
  'newToken': (string);
  'license': (_build_stack_license_v1beta1_License__Output | null);
}
