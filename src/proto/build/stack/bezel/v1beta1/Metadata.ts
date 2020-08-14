// Original file: proto/bzl.proto

import { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';

/**
 * Metadata about the UI application
 */
export interface Metadata {
  /**
   * Application name
   */
  'name'?: (string);
  /**
   * Application version
   */
  'version'?: (string);
  /**
   * Application commit
   */
  'commitId'?: (string);
  /**
   * The build date
   */
  'buildDate'?: (_google_protobuf_Timestamp);
}

/**
 * Metadata about the UI application
 */
export interface Metadata__Output {
  /**
   * Application name
   */
  'name': (string);
  /**
   * Application version
   */
  'version': (string);
  /**
   * Application commit
   */
  'commitId': (string);
  /**
   * The build date
   */
  'buildDate'?: (_google_protobuf_Timestamp__Output);
}
