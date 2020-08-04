// Original file: proto/bazel_flags.proto


export interface FlagInfo {
  /**
   * Name of the flag, without leading dashes.
   */
  'name'?: (string);
  /**
   * True if --noname exists, too.
   */
  'hasNegativeFlag'?: (boolean);
  /**
   * Help text of the flag.
   */
  'documentation'?: (string);
  /**
   * List of supported Bazel commands, e.g. ['build', 'test']
   */
  'commands'?: (string)[];
  /**
   * Flag name abbreviation, without leading dash.
   */
  'abbreviation'?: (string);
  /**
   * True if a flag is allowed to occur multiple times in a single arg list.
   */
  'allowsMultiple'?: (boolean);
}

export interface FlagInfo__Output {
  /**
   * Name of the flag, without leading dashes.
   */
  'name': (string);
  /**
   * True if --noname exists, too.
   */
  'hasNegativeFlag': (boolean);
  /**
   * Help text of the flag.
   */
  'documentation': (string);
  /**
   * List of supported Bazel commands, e.g. ['build', 'test']
   */
  'commands': (string)[];
  /**
   * Flag name abbreviation, without leading dash.
   */
  'abbreviation': (string);
  /**
   * True if a flag is allowed to occur multiple times in a single arg list.
   */
  'allowsMultiple': (boolean);
}
