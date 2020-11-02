// Original file: proto/codesearch.proto


export interface BazelQuery {
  /**
   * the primary bazel expression
   */
  'expression'?: (string);
  /**
   * external workspace names to include when constructing a universal query
   */
  'include'?: (string)[];
  /**
   * external workspace names to exclude when constructing a universal query
   */
  'exclude'?: (string)[];
  /**
   * if true, include external workspaces defined in @bazel_tools when
   * constructing a universal query
   */
  'bazelInternal'?: (boolean);
  /**
   * if true, exclude the default workspace when constructing a universal query
   */
  'excludeDefault'?: (boolean);
  /**
   * command line options for the query
   */
  'options'?: (string)[];
  /**
   * the command ('query' or 'cquery' - if empty default to 'query')
   */
  'command'?: (string);
}

export interface BazelQuery__Output {
  /**
   * the primary bazel expression
   */
  'expression': (string);
  /**
   * external workspace names to include when constructing a universal query
   */
  'include': (string)[];
  /**
   * external workspace names to exclude when constructing a universal query
   */
  'exclude': (string)[];
  /**
   * if true, include external workspaces defined in @bazel_tools when
   * constructing a universal query
   */
  'bazelInternal': (boolean);
  /**
   * if true, exclude the default workspace when constructing a universal query
   */
  'excludeDefault': (boolean);
  /**
   * command line options for the query
   */
  'options': (string)[];
  /**
   * the command ('query' or 'cquery' - if empty default to 'query')
   */
  'command': (string);
}
