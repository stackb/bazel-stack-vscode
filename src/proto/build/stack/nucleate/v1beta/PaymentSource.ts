// Original file: proto/nucleate.proto


/**
 * PaymentSource such as a credit-card
 */
export interface PaymentSource {
  'number'?: (string);
  'expYear'?: (string);
  'expMonth'?: (string);
  'cvc'?: (string);
  'addressZip'?: (string);
}

/**
 * PaymentSource such as a credit-card
 */
export interface PaymentSource__Output {
  'number': (string);
  'expYear': (string);
  'expMonth': (string);
  'cvc': (string);
  'addressZip': (string);
}
