// Original file: proto/remote_execution.proto


// Original file: proto/remote_execution.proto

export enum _build_bazel_remote_execution_v2_DigestFunction_Value {
  /**
   * It is an error for the server to return this value.
   */
  UNKNOWN = 0,
  /**
   * The SHA-256 digest function.
   */
  SHA256 = 1,
  /**
   * The SHA-1 digest function.
   */
  SHA1 = 2,
  /**
   * The MD5 digest function.
   */
  MD5 = 3,
  /**
   * The Microsoft "VSO-Hash" paged SHA256 digest function.
   * See
   * https://github.com/microsoft/BuildXL/blob/master/Documentation/Specs/PagedHash.md
   * .
   */
  VSO = 4,
  /**
   * The SHA-384 digest function.
   */
  SHA384 = 5,
  /**
   * The SHA-512 digest function.
   */
  SHA512 = 6,
}

/**
 * The digest function used for converting values into keys for CAS and Action
 * Cache.
 */
export interface DigestFunction {
}

/**
 * The digest function used for converting values into keys for CAS and Action
 * Cache.
 */
export interface DigestFunction__Output {
}
