// Original file: proto/build_event_stream.proto

import type { Long } from '@grpc/proto-loader';

/**
 * Payload of an event indicating the beginning of a new build. Usually, events
 * of those type start a new build-event stream. The target pattern requested
 * to be build is contained in one of the announced child events; it is an
 * invariant that precisely one of the announced child events has a non-empty
 * target pattern.
 */
export interface BuildStarted {
  uuid?: string;
  /**
   * Start of the build in ms since the epoch.
   * TODO(buchgr): Use google.protobuf.TimeStamp once bazel's protoc supports
   * it.
   */
  startTimeMillis?: number | string | Long;
  /**
   * Version of the build tool that is running.
   */
  buildToolVersion?: string;
  /**
   * A human-readable description of all the non-default option settings
   */
  optionsDescription?: string;
  /**
   * The name of the command that the user invoked.
   */
  command?: string;
  /**
   * The working directory from which the build tool was invoked.
   */
  workingDirectory?: string;
  /**
   * The directory of the workspace.
   */
  workspaceDirectory?: string;
  /**
   * The process ID of the Bazel server.
   */
  serverPid?: number | string | Long;
}

/**
 * Payload of an event indicating the beginning of a new build. Usually, events
 * of those type start a new build-event stream. The target pattern requested
 * to be build is contained in one of the announced child events; it is an
 * invariant that precisely one of the announced child events has a non-empty
 * target pattern.
 */
export interface BuildStarted__Output {
  uuid: string;
  /**
   * Start of the build in ms since the epoch.
   * TODO(buchgr): Use google.protobuf.TimeStamp once bazel's protoc supports
   * it.
   */
  startTimeMillis: Long;
  /**
   * Version of the build tool that is running.
   */
  buildToolVersion: string;
  /**
   * A human-readable description of all the non-default option settings
   */
  optionsDescription: string;
  /**
   * The name of the command that the user invoked.
   */
  command: string;
  /**
   * The working directory from which the build tool was invoked.
   */
  workingDirectory: string;
  /**
   * The directory of the workspace.
   */
  workspaceDirectory: string;
  /**
   * The process ID of the Bazel server.
   */
  serverPid: Long;
}
