// Original file: proto/license.proto


export interface LicenseStatusRequest {
  /**
   * the existing JWT token that encodes the user identity and current
   * subscription metadata.
   */
  'currentToken'?: (string);
}

export interface LicenseStatusRequest__Output {
  /**
   * the existing JWT token that encodes the user identity and current
   * subscription metadata.
   */
  'currentToken': (string);
}
