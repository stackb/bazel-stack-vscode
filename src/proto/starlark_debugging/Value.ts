// Original file: proto/starlark_debugging.proto

import type { Long } from '@grpc/proto-loader';

/**
 * The debugger representation of a Starlark value.
 */
export interface Value {
  /**
   * A label that describes this value's location or source in a value
   * hierarchy.
   * 
   * For example, in a stack frame, the label would be the name of the variable
   * to which the value is bound. For a value that is an element of a list, its
   * its label would be its subscript, such as "[4]". A value that is a field in
   * a struct would use the field's name as its label, and so forth.
   */
  'label'?: (string);
  /**
   * A string description of the value.
   */
  'description'?: (string);
  /**
   * A string describing the type of the value.
   * 
   * This field may be omitted if the value does not correspond to a "real" type
   * as far as the debugging view is concerned; for example, dictionaries will
   * be rendered as sequences of key/value pairs ("entries") but the entries
   * themselves do not have a meaningful type with respect to our rendering.
   */
  'type'?: (string);
  /**
   * Will be false if the value is known to have no children. May sometimes be
   * true if this isn't yet known, in which case GetChildrenResponse#children
   * will be empty.
   */
  'hasChildren'?: (boolean);
  /**
   * An identifier for this value, used to request its children. The same value
   * may be known by multiple ids. Not set for values without children.
   */
  'id'?: (number | string | Long);
}

/**
 * The debugger representation of a Starlark value.
 */
export interface Value__Output {
  /**
   * A label that describes this value's location or source in a value
   * hierarchy.
   * 
   * For example, in a stack frame, the label would be the name of the variable
   * to which the value is bound. For a value that is an element of a list, its
   * its label would be its subscript, such as "[4]". A value that is a field in
   * a struct would use the field's name as its label, and so forth.
   */
  'label': (string);
  /**
   * A string description of the value.
   */
  'description': (string);
  /**
   * A string describing the type of the value.
   * 
   * This field may be omitted if the value does not correspond to a "real" type
   * as far as the debugging view is concerned; for example, dictionaries will
   * be rendered as sequences of key/value pairs ("entries") but the entries
   * themselves do not have a meaningful type with respect to our rendering.
   */
  'type': (string);
  /**
   * Will be false if the value is known to have no children. May sometimes be
   * true if this isn't yet known, in which case GetChildrenResponse#children
   * will be empty.
   */
  'hasChildren': (boolean);
  /**
   * An identifier for this value, used to request its children. The same value
   * may be known by multiple ids. Not set for values without children.
   */
  'id': (Long);
}
