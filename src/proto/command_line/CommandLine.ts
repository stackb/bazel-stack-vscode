// Original file: proto/command_line.proto

import type { CommandLineSection as _command_line_CommandLineSection, CommandLineSection__Output as _command_line_CommandLineSection__Output } from '../command_line/CommandLineSection';

/**
 * Representation of a Bazel command line.
 */
export interface CommandLine {
  /**
   * A title for this command line value, to differentiate it from others.
   * In particular, a single invocation may wish to report both the literal and
   * canonical command lines, and this label would be used to differentiate
   * between both versions. This is a string for flexibility.
   */
  'commandLineLabel'?: (string);
  /**
   * A Bazel command line is made of distinct parts. For example,
   * `bazel --nomaster_bazelrc test --nocache_test_results //foo:aTest`
   * has the executable "bazel", a startup flag, a command "test", a command
   * flag, and a test target. There could be many more flags and targets, or
   * none (`bazel info` for example), but the basic structure is there. The
   * command line should be broken down into these logical sections here.
   */
  'sections'?: (_command_line_CommandLineSection)[];
}

/**
 * Representation of a Bazel command line.
 */
export interface CommandLine__Output {
  /**
   * A title for this command line value, to differentiate it from others.
   * In particular, a single invocation may wish to report both the literal and
   * canonical command lines, and this label would be used to differentiate
   * between both versions. This is a string for flexibility.
   */
  'commandLineLabel': (string);
  /**
   * A Bazel command line is made of distinct parts. For example,
   * `bazel --nomaster_bazelrc test --nocache_test_results //foo:aTest`
   * has the executable "bazel", a startup flag, a command "test", a command
   * flag, and a test target. There could be many more flags and targets, or
   * none (`bazel info` for example), but the basic structure is there. The
   * command line should be broken down into these logical sections here.
   */
  'sections': (_command_line_CommandLineSection__Output)[];
}
