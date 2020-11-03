// Original file: proto/starlark_debugging.proto


/**
 * A location in Starlark source code.
 */
export interface Location {
  /**
   * The path of the Starlark source file.
   */
  'path'?: (string);
  /**
   * A 1-indexed line number in the file denoted by path.
   */
  'lineNumber'?: (number);
  /**
   * A 1-indexed column number in the file denoted by path. 0 (/unset) indicates
   * column number is unknown or irrelevant.
   */
  'columnNumber'?: (number);
}

/**
 * A location in Starlark source code.
 */
export interface Location__Output {
  /**
   * The path of the Starlark source file.
   */
  'path': (string);
  /**
   * A 1-indexed line number in the file denoted by path.
   */
  'lineNumber': (number);
  /**
   * A 1-indexed column number in the file denoted by path. 0 (/unset) indicates
   * column number is unknown or irrelevant.
   */
  'columnNumber': (number);
}
