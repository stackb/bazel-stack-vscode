// Original file: proto/command_line.proto

import type { Option as _command_line_Option, Option__Output as _command_line_Option__Output } from '../command_line/Option';

/**
 * Wrapper to allow a list of options in the "oneof" section_type.
 */
export interface OptionList {
  /**
   * Wrapper to allow a list of options in the "oneof" section_type.
   */
  'option'?: (_command_line_Option)[];
}

/**
 * Wrapper to allow a list of options in the "oneof" section_type.
 */
export interface OptionList__Output {
  /**
   * Wrapper to allow a list of options in the "oneof" section_type.
   */
  'option': (_command_line_Option__Output)[];
}
