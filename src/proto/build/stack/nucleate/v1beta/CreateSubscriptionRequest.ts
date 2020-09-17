// Original file: proto/nucleate.proto

import { PaymentSource as _build_stack_nucleate_v1beta_PaymentSource, PaymentSource__Output as _build_stack_nucleate_v1beta_PaymentSource__Output } from '../../../../build/stack/nucleate/v1beta/PaymentSource';

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
  /**
   * if the card params are being explicitly specified
   */
  'paymentSource'?: (_build_stack_nucleate_v1beta_PaymentSource);
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
  /**
   * if the card params are being explicitly specified
   */
  'paymentSource'?: (_build_stack_nucleate_v1beta_PaymentSource__Output);
}
