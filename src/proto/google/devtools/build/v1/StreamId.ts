// Original file: proto/build_events.proto

// Original file: proto/build_events.proto

/**
 * Which build component generates this event stream. Each build component
 * may generate one event stream.
 */
export enum _google_devtools_build_v1_StreamId_BuildComponent {
  /**
   * Unknown or unspecified; callers should never set this value.
   */
  UNKNOWN_COMPONENT = 0,
  /**
   * A component that coordinates builds.
   */
  CONTROLLER = 1,
  /**
   * A component that runs executables needed to complete a build.
   */
  WORKER = 2,
  /**
   * A component that builds something.
   */
  TOOL = 3,
}

/**
 * Unique identifier for a build event stream.
 */
export interface StreamId {
  /**
   * The id of a Build message.
   */
  buildId?: string;
  /**
   * The component that emitted this event.
   */
  component?:
    | _google_devtools_build_v1_StreamId_BuildComponent
    | keyof typeof _google_devtools_build_v1_StreamId_BuildComponent;
  /**
   * The unique invocation ID within this build.
   * It should be the same as {invocation} (below) during the migration.
   */
  invocationId?: string;
}

/**
 * Unique identifier for a build event stream.
 */
export interface StreamId__Output {
  /**
   * The id of a Build message.
   */
  buildId: string;
  /**
   * The component that emitted this event.
   */
  component: _google_devtools_build_v1_StreamId_BuildComponent;
  /**
   * The unique invocation ID within this build.
   * It should be the same as {invocation} (below) during the migration.
   */
  invocationId: string;
}
