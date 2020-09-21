// Original file: proto/option_filters.proto

/**
 * Docs in java enum.
 */
export enum OptionEffectTag {
  /**
   * This option's effect or intent is unknown.
   */
  UNKNOWN = 0,
  /**
   * This flag has literally no effect.
   */
  NO_OP = 1,
  LOSES_INCREMENTAL_STATE = 2,
  CHANGES_INPUTS = 3,
  AFFECTS_OUTPUTS = 4,
  BUILD_FILE_SEMANTICS = 5,
  BAZEL_INTERNAL_CONFIGURATION = 6,
  LOADING_AND_ANALYSIS = 7,
  EXECUTION = 8,
  HOST_MACHINE_RESOURCE_OPTIMIZATIONS = 9,
  EAGERNESS_TO_EXIT = 10,
  BAZEL_MONITORING = 11,
  TERMINAL_OUTPUT = 12,
  ACTION_COMMAND_LINES = 13,
  TEST_RUNNER = 14,
}
