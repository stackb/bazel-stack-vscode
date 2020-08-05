// Original file: proto/license.proto

import { License as _build_stack_license_v1beta1_License, License__Output as _build_stack_license_v1beta1_License__Output } from '../../../../build/stack/license/v1beta1/License';

// Original file: proto/license.proto

export enum _build_stack_license_v1beta1_LicenseStatusResponse_Status {
  /**
   * No status known
   */
  STATUS_UNKNOWN = 0,
  /**
   * User not recognized
   */
  BAD_TOKEN = 1,
  /**
   * User license has expired
   */
  EXPIRED = 2,
  /**
   * User license is valid - in trial period
   */
  TRIAL = 3,
  /**
   * User license is valid and active
   */
  ACTIVE = 4,
}

export interface LicenseStatusResponse {
  'status'?: (_build_stack_license_v1beta1_LicenseStatusResponse_Status | keyof typeof _build_stack_license_v1beta1_LicenseStatusResponse_Status);
  'license'?: (_build_stack_license_v1beta1_License);
}

export interface LicenseStatusResponse__Output {
  'status': (keyof typeof _build_stack_license_v1beta1_LicenseStatusResponse_Status);
  'license'?: (_build_stack_license_v1beta1_License__Output);
}
