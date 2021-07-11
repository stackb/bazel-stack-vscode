// Original file: proto/license.proto


export interface RenewLicenseRequest {
  /**
   * the existing JWT token that encodes the user identity and current
   * subscription metadata.
   */
  'currentToken'?: (string);
}

export interface RenewLicenseRequest__Output {
  /**
   * the existing JWT token that encodes the user identity and current
   * subscription metadata.
   */
  'currentToken': (string);
}
