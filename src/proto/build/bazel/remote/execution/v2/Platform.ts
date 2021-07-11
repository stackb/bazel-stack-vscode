// Original file: proto/remote_execution.proto


/**
 * A single property for the environment. The server is responsible for
 * specifying the property `name`s that it accepts. If an unknown `name` is
 * provided in the requirements for an
 * [Action][build.bazel.remote.execution.v2.Action], the server SHOULD
 * reject the execution request. If permitted by the server, the same `name`
 * may occur multiple times.
 * 
 * The server is also responsible for specifying the interpretation of
 * property `value`s. For instance, a property describing how much RAM must be
 * available may be interpreted as allowing a worker with 16GB to fulfill a
 * request for 8GB, while a property describing the OS environment on which
 * the action must be performed may require an exact match with the worker's
 * OS.
 * 
 * The server MAY use the `value` of one or more properties to determine how
 * it sets up the execution environment, such as by making specific system
 * files available to the worker.
 */
export interface _build_bazel_remote_execution_v2_Platform_Property {
  /**
   * The property name.
   */
  'name'?: (string);
  /**
   * The property value.
   */
  'value'?: (string);
}

/**
 * A single property for the environment. The server is responsible for
 * specifying the property `name`s that it accepts. If an unknown `name` is
 * provided in the requirements for an
 * [Action][build.bazel.remote.execution.v2.Action], the server SHOULD
 * reject the execution request. If permitted by the server, the same `name`
 * may occur multiple times.
 * 
 * The server is also responsible for specifying the interpretation of
 * property `value`s. For instance, a property describing how much RAM must be
 * available may be interpreted as allowing a worker with 16GB to fulfill a
 * request for 8GB, while a property describing the OS environment on which
 * the action must be performed may require an exact match with the worker's
 * OS.
 * 
 * The server MAY use the `value` of one or more properties to determine how
 * it sets up the execution environment, such as by making specific system
 * files available to the worker.
 */
export interface _build_bazel_remote_execution_v2_Platform_Property__Output {
  /**
   * The property name.
   */
  'name': (string);
  /**
   * The property value.
   */
  'value': (string);
}

/**
 * A `Platform` is a set of requirements, such as hardware, operating system, or
 * compiler toolchain, for an
 * [Action][build.bazel.remote.execution.v2.Action]'s execution
 * environment. A `Platform` is represented as a series of key-value pairs
 * representing the properties that are required of the platform.
 */
export interface Platform {
  /**
   * The properties that make up this platform. In order to ensure that
   * equivalent `Platform`s always hash to the same value, the properties MUST
   * be lexicographically sorted by name, and then by value. Sorting of strings
   * is done by code point, equivalently, by the UTF-8 bytes.
   */
  'properties'?: (_build_bazel_remote_execution_v2_Platform_Property)[];
}

/**
 * A `Platform` is a set of requirements, such as hardware, operating system, or
 * compiler toolchain, for an
 * [Action][build.bazel.remote.execution.v2.Action]'s execution
 * environment. A `Platform` is represented as a series of key-value pairs
 * representing the properties that are required of the platform.
 */
export interface Platform__Output {
  /**
   * The properties that make up this platform. In order to ensure that
   * equivalent `Platform`s always hash to the same value, the properties MUST
   * be lexicographically sorted by name, and then by value. Sorting of strings
   * is done by code point, equivalently, by the UTF-8 bytes.
   */
  'properties': (_build_bazel_remote_execution_v2_Platform_Property__Output)[];
}
