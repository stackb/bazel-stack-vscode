// Original file: proto/license.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';

// Original file: proto/license.proto

export enum _build_stack_license_v1beta1_License_Domain {
  UNKNOWN_DOMAIN = 0,
  GITHUB = 1,
  EMAIL = 2,
}

// Original file: proto/license.proto

/**
 * The license type. Currently only individual licenses are supported
 */
export enum _build_stack_license_v1beta1_License_Type {
  TYPE_UNKNOWN = 0,
  INDIVIDUAL = 1,
}

/**
 * License captures the association between a user identity, a product
 * subscription, and a timestamp when the subscription expires.
 */
export interface License {
  /**
   * The type of this license
   */
  'type'?: (_build_stack_license_v1beta1_License_Type | keyof typeof _build_stack_license_v1beta1_License_Type);
  /**
   * The domain to which the ID belongs
   */
  'domain'?: (_build_stack_license_v1beta1_License_Domain | keyof typeof _build_stack_license_v1beta1_License_Domain);
  /**
   * The id, such as 'pcj' (github domain).  If the email is equal to the id,
   * implies that the domain is "EMAIL" (this is for users that don't register
   * via github oauth and need to use a corporate email address).
   */
  'id'?: (string);
  /**
   * User name
   */
  'name'?: (string);
  /**
   * User email address
   */
  'email'?: (string);
  /**
   * Optional avatar_url.
   */
  'avatarUrl'?: (string);
  /**
   * The name of the subscription plan the license applies to
   */
  'subscriptionName'?: (string);
  /**
   * The UUID of the license.
   */
  'uuid'?: (string);
  /**
   * The expiration date of the license
   */
  'expiresAt'?: (_google_protobuf_Timestamp | null);
  /**
   * The creation date of the license
   */
  'createdAt'?: (_google_protobuf_Timestamp | null);
}

/**
 * License captures the association between a user identity, a product
 * subscription, and a timestamp when the subscription expires.
 */
export interface License__Output {
  /**
   * The type of this license
   */
  'type': (_build_stack_license_v1beta1_License_Type);
  /**
   * The domain to which the ID belongs
   */
  'domain': (_build_stack_license_v1beta1_License_Domain);
  /**
   * The id, such as 'pcj' (github domain).  If the email is equal to the id,
   * implies that the domain is "EMAIL" (this is for users that don't register
   * via github oauth and need to use a corporate email address).
   */
  'id': (string);
  /**
   * User name
   */
  'name': (string);
  /**
   * User email address
   */
  'email': (string);
  /**
   * Optional avatar_url.
   */
  'avatarUrl': (string);
  /**
   * The name of the subscription plan the license applies to
   */
  'subscriptionName': (string);
  /**
   * The UUID of the license.
   */
  'uuid': (string);
  /**
   * The expiration date of the license
   */
  'expiresAt': (_google_protobuf_Timestamp__Output | null);
  /**
   * The creation date of the license
   */
  'createdAt': (_google_protobuf_Timestamp__Output | null);
}
