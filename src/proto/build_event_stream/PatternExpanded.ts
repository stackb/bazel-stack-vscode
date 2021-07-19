// Original file: proto/build_event_stream.proto

/**
 * Payload of the event indicating the expansion of a target pattern.
 * The main information is in the chaining part: the id will contain the
 * target pattern that was expanded and the children id will contain the
 * target or target pattern it was expanded to.
 */
export interface PatternExpanded {}

/**
 * Payload of the event indicating the expansion of a target pattern.
 * The main information is in the chaining part: the id will contain the
 * target pattern that was expanded and the children id will contain the
 * target or target pattern it was expanded to.
 */
export interface PatternExpanded__Output {}
