// Original file: proto/build_event_stream.proto


// Original file: proto/build_event_stream.proto

export enum _build_event_stream_ConvenienceSymlink_Action {
  UNKNOWN = 0,
  /**
   * Indicates a symlink should be created, or overwritten if it already
   * exists.
   */
  CREATE = 1,
  /**
   * Indicates a symlink should be deleted if it already exists.
   */
  DELETE = 2,
}

/**
 * The message that contains what type of action to perform on a given path and
 * target of a symlink.
 */
export interface ConvenienceSymlink {
  /**
   * The path of the symlink to be created or deleted, absolute or relative to
   * the workspace, creating any directories necessary. If a symlink already
   * exists at that location, then it should be replaced by a symlink pointing
   * to the new target.
   */
  'path'?: (string);
  /**
   * The operation we are performing on the symlink.
   */
  'action'?: (_build_event_stream_ConvenienceSymlink_Action | keyof typeof _build_event_stream_ConvenienceSymlink_Action);
  /**
   * If action is CREATE, this is the target path that the symlink should point
   * to. If the path points underneath the output base, it is relative to the
   * output base; otherwise it is absolute.
   * 
   * If action is DELETE, this field is not set.
   */
  'target'?: (string);
}

/**
 * The message that contains what type of action to perform on a given path and
 * target of a symlink.
 */
export interface ConvenienceSymlink__Output {
  /**
   * The path of the symlink to be created or deleted, absolute or relative to
   * the workspace, creating any directories necessary. If a symlink already
   * exists at that location, then it should be replaced by a symlink pointing
   * to the new target.
   */
  'path': (string);
  /**
   * The operation we are performing on the symlink.
   */
  'action': (_build_event_stream_ConvenienceSymlink_Action);
  /**
   * If action is CREATE, this is the target path that the symlink should point
   * to. If the path points underneath the output base, it is relative to the
   * output base; otherwise it is absolute.
   * 
   * If action is DELETE, this field is not set.
   */
  'target': (string);
}
