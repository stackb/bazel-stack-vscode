// Original file: proto/build_event_stream.proto

import type { ConvenienceSymlink as _build_event_stream_ConvenienceSymlink, ConvenienceSymlink__Output as _build_event_stream_ConvenienceSymlink__Output } from '../build_event_stream/ConvenienceSymlink';

/**
 * Event describing all convenience symlinks (i.e., workspace symlinks) to be
 * created or deleted once the execution phase has begun. Note that this event
 * does not say anything about whether or not the build tool actually executed
 * these filesystem operations; it only says what logical operations should be
 * performed. This event is emitted exactly once per build; if no symlinks are
 * to be modified, the event is still emitted with empty contents.
 */
export interface ConvenienceSymlinksIdentified {
  'convenienceSymlinks'?: (_build_event_stream_ConvenienceSymlink)[];
}

/**
 * Event describing all convenience symlinks (i.e., workspace symlinks) to be
 * created or deleted once the execution phase has begun. Note that this event
 * does not say anything about whether or not the build tool actually executed
 * these filesystem operations; it only says what logical operations should be
 * performed. This event is emitted exactly once per build; if no symlinks are
 * to be modified, the event is still emitted with empty contents.
 */
export interface ConvenienceSymlinksIdentified__Output {
  'convenienceSymlinks': (_build_event_stream_ConvenienceSymlink__Output)[];
}
