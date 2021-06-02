// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * A request to list the children of a previously-communicated Value, such as
 * its elements (for a list or dictionary), its fields (for a struct), and so
 * forth.
 */
export interface GetChildrenRequest {
  /**
   * The identifier of the relevant thread.
   */
  'threadId'?: (number | string | Long);
  /**
   * The identifier of the value for which children are being requested. If the
   * value has no children, an empty list will be returned in
   * GetChildrenResponse.
   */
  'valueId'?: (number | string | Long);
}

/**
 * A request to list the children of a previously-communicated Value, such as
 * its elements (for a list or dictionary), its fields (for a struct), and so
 * forth.
 */
export interface GetChildrenRequest__Output {
  /**
   * The identifier of the relevant thread.
   */
  'threadId': (Long);
  /**
   * The identifier of the value for which children are being requested. If the
   * value has no children, an empty list will be returned in
   * GetChildrenResponse.
   */
  'valueId': (Long);
}
