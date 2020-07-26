// Original file: src/proto/stardoc_output/stardoc_output.proto

/**
 * Representation of a Starlark rule attribute type. These generally
 * have a one-to-one correspondence with functions defined at
 * https://docs.bazel.build/versions/master/skylark/lib/attr.html.
 */
export enum AttributeType {
  UNKNOWN = 0,
  /**
   * A special case of STRING; all rules have exactly one implicit
   * attribute "name" of type NAME.
   */
  NAME = 1,
  INT = 2,
  LABEL = 3,
  STRING = 4,
  STRING_LIST = 5,
  INT_LIST = 6,
  LABEL_LIST = 7,
  BOOLEAN = 8,
  LABEL_STRING_DICT = 9,
  STRING_DICT = 10,
  STRING_LIST_DICT = 11,
  OUTPUT = 12,
  OUTPUT_LIST = 13,
}
