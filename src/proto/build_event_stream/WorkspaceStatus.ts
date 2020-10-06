// Original file: proto/build_event_stream.proto


export interface _build_event_stream_WorkspaceStatus_Item {
  'key'?: (string);
  'value'?: (string);
}

export interface _build_event_stream_WorkspaceStatus_Item__Output {
  'key': (string);
  'value': (string);
}

/**
 * Payload of an event reporting the workspace status. Key-value pairs can be
 * provided by specifying the workspace_status_command to an executable that
 * returns one key-value pair per line of output (key and value separated by a
 * space).
 */
export interface WorkspaceStatus {
  'item'?: (_build_event_stream_WorkspaceStatus_Item)[];
}

/**
 * Payload of an event reporting the workspace status. Key-value pairs can be
 * provided by specifying the workspace_status_command to an executable that
 * returns one key-value pair per line of output (key and value separated by a
 * space).
 */
export interface WorkspaceStatus__Output {
  'item': (_build_event_stream_WorkspaceStatus_Item__Output)[];
}
