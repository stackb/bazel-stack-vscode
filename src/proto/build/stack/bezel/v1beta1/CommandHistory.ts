// Original file: proto/bzl.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';

/**
 * Used to implement a simple cache of what the user has built
 */
export interface CommandHistory {
  /**
   * A hashcode of the args, used as a unique identifier
   */
  'id'?: (string);
  /**
   * The number of times the user has run this command
   */
  'count'?: (number);
  /**
   * the workspace cwd that was used
   */
  'cwd'?: (string);
  /**
   * the directory relative to the cwd that it was invoked in
   */
  'dir'?: (string);
  /**
   * the args provided
   */
  'arg'?: (string)[];
  /**
   * the command that is included in args list
   */
  'command'?: (string);
  /**
   * the last time this invocation was run
   */
  'createTime'?: (_google_protobuf_Timestamp | null);
  /**
   * the last time this invocation was run
   */
  'updateTime'?: (_google_protobuf_Timestamp | null);
  /**
   * the output base (md5 of the cwd)
   */
  'outputBase'?: (string);
  /**
   * configured rule classes, if known
   */
  'ruleClass'?: (string)[];
}

/**
 * Used to implement a simple cache of what the user has built
 */
export interface CommandHistory__Output {
  /**
   * A hashcode of the args, used as a unique identifier
   */
  'id': (string);
  /**
   * The number of times the user has run this command
   */
  'count': (number);
  /**
   * the workspace cwd that was used
   */
  'cwd': (string);
  /**
   * the directory relative to the cwd that it was invoked in
   */
  'dir': (string);
  /**
   * the args provided
   */
  'arg': (string)[];
  /**
   * the command that is included in args list
   */
  'command': (string);
  /**
   * the last time this invocation was run
   */
  'createTime': (_google_protobuf_Timestamp__Output | null);
  /**
   * the last time this invocation was run
   */
  'updateTime': (_google_protobuf_Timestamp__Output | null);
  /**
   * the output base (md5 of the cwd)
   */
  'outputBase': (string);
  /**
   * configured rule classes, if known
   */
  'ruleClass': (string)[];
}
