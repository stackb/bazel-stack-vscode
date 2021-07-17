// Original file: proto/build_event_stream.proto

/**
 * Payload of an event indicating that an external resource was fetched. This
 * event will only occur in streams where an actual fetch happened, not in ones
 * where a cached copy of the entity to be fetched was used.
 */
export interface Fetch {
  /**
   * Payload of an event indicating that an external resource was fetched. This
   * event will only occur in streams where an actual fetch happened, not in ones
   * where a cached copy of the entity to be fetched was used.
   */
  success?: boolean;
}

/**
 * Payload of an event indicating that an external resource was fetched. This
 * event will only occur in streams where an actual fetch happened, not in ones
 * where a cached copy of the entity to be fetched was used.
 */
export interface Fetch__Output {
  /**
   * Payload of an event indicating that an external resource was fetched. This
   * event will only occur in streams where an actual fetch happened, not in ones
   * where a cached copy of the entity to be fetched was used.
   */
  success: boolean;
}
