// Original file: proto/remote_execution.proto

import type { Long } from '@grpc/proto-loader';

/**
 * A content digest. A digest for a given blob consists of the size of the blob
 * and its hash. The hash algorithm to use is defined by the server.
 *
 * The size is considered to be an integral part of the digest and cannot be
 * separated. That is, even if the `hash` field is correctly specified but
 * `size_bytes` is not, the server MUST reject the request.
 *
 * The reason for including the size in the digest is as follows: in a great
 * many cases, the server needs to know the size of the blob it is about to work
 * with prior to starting an operation with it, such as flattening Merkle tree
 * structures or streaming it to a worker. Technically, the server could
 * implement a separate metadata store, but this results in a significantly more
 * complicated implementation as opposed to having the client specify the size
 * up-front (or storing the size along with the digest in every message where
 * digests are embedded). This does mean that the API leaks some implementation
 * details of (what we consider to be) a reasonable server implementation, but
 * we consider this to be a worthwhile tradeoff.
 *
 * When a `Digest` is used to refer to a proto message, it always refers to the
 * message in binary encoded form. To ensure consistent hashing, clients and
 * servers MUST ensure that they serialize messages according to the following
 * rules, even if there are alternate valid encodings for the same message:
 *
 * * Fields are serialized in tag order.
 * * There are no unknown fields.
 * * There are no duplicate fields.
 * * Fields are serialized according to the default semantics for their type.
 *
 * Most protocol buffer implementations will always follow these rules when
 * serializing, but care should be taken to avoid shortcuts. For instance,
 * concatenating two messages to merge them may produce duplicate fields.
 */
export interface Digest {
  /**
   * The hash. In the case of SHA-256, it will always be a lowercase hex string
   * exactly 64 characters long.
   */
  hash?: string;
  /**
   * The size of the blob, in bytes.
   */
  sizeBytes?: number | string | Long;
}

/**
 * A content digest. A digest for a given blob consists of the size of the blob
 * and its hash. The hash algorithm to use is defined by the server.
 *
 * The size is considered to be an integral part of the digest and cannot be
 * separated. That is, even if the `hash` field is correctly specified but
 * `size_bytes` is not, the server MUST reject the request.
 *
 * The reason for including the size in the digest is as follows: in a great
 * many cases, the server needs to know the size of the blob it is about to work
 * with prior to starting an operation with it, such as flattening Merkle tree
 * structures or streaming it to a worker. Technically, the server could
 * implement a separate metadata store, but this results in a significantly more
 * complicated implementation as opposed to having the client specify the size
 * up-front (or storing the size along with the digest in every message where
 * digests are embedded). This does mean that the API leaks some implementation
 * details of (what we consider to be) a reasonable server implementation, but
 * we consider this to be a worthwhile tradeoff.
 *
 * When a `Digest` is used to refer to a proto message, it always refers to the
 * message in binary encoded form. To ensure consistent hashing, clients and
 * servers MUST ensure that they serialize messages according to the following
 * rules, even if there are alternate valid encodings for the same message:
 *
 * * Fields are serialized in tag order.
 * * There are no unknown fields.
 * * There are no duplicate fields.
 * * Fields are serialized according to the default semantics for their type.
 *
 * Most protocol buffer implementations will always follow these rules when
 * serializing, but care should be taken to avoid shortcuts. For instance,
 * concatenating two messages to merge them may produce duplicate fields.
 */
export interface Digest__Output {
  /**
   * The hash. In the case of SHA-256, it will always be a lowercase hex string
   * exactly 64 characters long.
   */
  hash: string;
  /**
   * The size of the blob, in bytes.
   */
  sizeBytes: Long;
}
