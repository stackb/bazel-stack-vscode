// Original file: proto/nucleate.proto


/**
 * Username is implied in the auth headers
 */
export interface CreateSubscriptionRequest {
  /**
   * The stripe payment source token that was generated in the frontend
   */
  'tokenId'?: (string);
  /**
   * the plan that the user is subscribing to
   */
  'planId'?: (string);
}

/**
 * Username is implied in the auth headers
 */
export interface CreateSubscriptionRequest__Output {
  /**
   * The stripe payment source token that was generated in the frontend
   */
  'tokenId': (string);
  /**
   * the plan that the user is subscribing to
   */
  'planId': (string);
}
