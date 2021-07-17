// Original file: proto/remote_execution.proto

/**
 * A `ResultsCachePolicy` is used for fine-grained control over how action
 * outputs are stored in the CAS and Action Cache.
 */
export interface ResultsCachePolicy {
  /**
   * The priority (relative importance) of this content in the overall cache.
   * Generally, a lower value means a longer retention time or other advantage,
   * but the interpretation of a given value is server-dependent. A priority of
   * 0 means a *default* value, decided by the server.
   *
   * The particular semantics of this field is up to the server. In particular,
   * every server will have their own supported range of priorities, and will
   * decide how these map into retention/eviction policy.
   */
  priority?: number;
}

/**
 * A `ResultsCachePolicy` is used for fine-grained control over how action
 * outputs are stored in the CAS and Action Cache.
 */
export interface ResultsCachePolicy__Output {
  /**
   * The priority (relative importance) of this content in the overall cache.
   * Generally, a lower value means a longer retention time or other advantage,
   * but the interpretation of a given value is server-dependent. A priority of
   * 0 means a *default* value, decided by the server.
   *
   * The particular semantics of this field is up to the server. In particular,
   * every server will have their own supported range of priorities, and will
   * decide how these map into retention/eviction policy.
   */
  priority: number;
}
