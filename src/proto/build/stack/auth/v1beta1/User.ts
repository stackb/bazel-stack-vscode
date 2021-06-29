// Original file: proto/auth.proto


export interface User {
  'handle'?: (string);
  'domain'?: (string);
  'login'?: (string);
  'name'?: (string);
  'avatarUrl'?: (string);
  'splashUrl'?: (string);
  'email'?: (string);
  'isOrg'?: (boolean);
  /**
   * if the email of the user has been not been confirmed yet.
   */
  'isUnconfirmed'?: (boolean);
}

export interface User__Output {
  'handle': (string);
  'domain': (string);
  'login': (string);
  'name': (string);
  'avatarUrl': (string);
  'splashUrl': (string);
  'email': (string);
  'isOrg': (boolean);
  /**
   * if the email of the user has been not been confirmed yet.
   */
  'isUnconfirmed': (boolean);
}
