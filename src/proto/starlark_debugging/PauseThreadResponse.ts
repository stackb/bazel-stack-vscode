// Original file: proto/starlark_debugging.proto


/**
 * The response to a PauseThreadRequest. This is an acknowledgement that the
 * request was received. Actual pausing of individual threads happens
 * asynchronously, and will be communicated via ThreadPausedEvent(s).
 */
export interface PauseThreadResponse {
}

/**
 * The response to a PauseThreadRequest. This is an acknowledgement that the
 * request was received. Actual pausing of individual threads happens
 * asynchronously, and will be communicated via ThreadPausedEvent(s).
 */
export interface PauseThreadResponse__Output {
}
