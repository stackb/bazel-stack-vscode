// Original file: proto/license.proto


export interface RenewLicenseResponse {
  /**
   * a JWT token that encodes the user identity and new license metadata.
   */
  'newToken'?: (string);
}

export interface RenewLicenseResponse__Output {
  /**
   * a JWT token that encodes the user identity and new license metadata.
   */
  'newToken': (string);
}
