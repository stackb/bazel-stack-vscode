// Original file: proto/command_line.proto

import type {
  ChunkList as _command_line_ChunkList,
  ChunkList__Output as _command_line_ChunkList__Output,
} from '../command_line/ChunkList';
import type {
  OptionList as _command_line_OptionList,
  OptionList__Output as _command_line_OptionList__Output,
} from '../command_line/OptionList';

/**
 * A section of the Bazel command line.
 */
export interface CommandLineSection {
  /**
   * The name of this section, such as "startup_option" or "command".
   */
  sectionLabel?: string;
  /**
   * Sections with non-options, such as the list of targets or the command,
   * should use simple string chunks.
   */
  chunkList?: _command_line_ChunkList;
  /**
   * Startup and command options are lists of options and belong here.
   */
  optionList?: _command_line_OptionList;
  sectionType?: 'chunkList' | 'optionList';
}

/**
 * A section of the Bazel command line.
 */
export interface CommandLineSection__Output {
  /**
   * The name of this section, such as "startup_option" or "command".
   */
  sectionLabel: string;
  /**
   * Sections with non-options, such as the list of targets or the command,
   * should use simple string chunks.
   */
  chunkList?: _command_line_ChunkList__Output;
  /**
   * Startup and command options are lists of options and belong here.
   */
  optionList?: _command_line_OptionList__Output;
  sectionType: 'chunkList' | 'optionList';
}
