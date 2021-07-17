// Original file: proto/remote_execution.proto

/**
 * An `ExecutionPolicy` can be used to control the scheduling of the action.
 */
export interface ExecutionPolicy {
  /**
   * The priority (relative importance) of this action. Generally, a lower value
   * means that the action should be run sooner than actions having a greater
   * priority value, but the interpretation of a given value is server-
   * dependent. A priority of 0 means the *default* priority. Priorities may be
   * positive or negative, and such actions should run later or sooner than
   * actions having the default priority, respectively. The particular semantics
   * of this field is up to the server. In particular, every server will have
   * their own supported range of priorities, and will decide how these map into
   * scheduling policy.
   */
  priority?: number;
}

/**
 * An `ExecutionPolicy` can be used to control the scheduling of the action.
 */
export interface ExecutionPolicy__Output {
  /**
   * The priority (relative importance) of this action. Generally, a lower value
   * means that the action should be run sooner than actions having a greater
   * priority value, but the interpretation of a given value is server-
   * dependent. A priority of 0 means the *default* priority. Priorities may be
   * positive or negative, and such actions should run later or sooner than
   * actions having the default priority, respectively. The particular semantics
   * of this field is up to the server. In particular, every server will have
   * their own supported range of priorities, and will decide how these map into
   * scheduling policy.
   */
  priority: number;
}
