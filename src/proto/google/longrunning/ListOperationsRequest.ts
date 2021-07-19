// Original file: proto/operations.proto

/**
 * The request message for [Operations.ListOperations][google.longrunning.Operations.ListOperations].
 */
export interface ListOperationsRequest {
  /**
   * The standard list filter.
   */
  filter?: string;
  /**
   * The standard list page size.
   */
  pageSize?: number;
  /**
   * The standard list page token.
   */
  pageToken?: string;
  /**
   * The name of the operation's parent resource.
   */
  name?: string;
}

/**
 * The request message for [Operations.ListOperations][google.longrunning.Operations.ListOperations].
 */
export interface ListOperationsRequest__Output {
  /**
   * The standard list filter.
   */
  filter: string;
  /**
   * The standard list page size.
   */
  pageSize: number;
  /**
   * The standard list page token.
   */
  pageToken: string;
  /**
   * The name of the operation's parent resource.
   */
  name: string;
}
