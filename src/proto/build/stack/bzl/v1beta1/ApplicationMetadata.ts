// Original file: src/proto/build/stack/bzl/v1beta1/application.proto

import { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';

/**
 * ApplicationMetadata is produced by the GetMetadata rpc and provides details
 * about the backand application
 */
export interface ApplicationMetadata {
  /**
   * The name of the application
   */
  'name'?: (string);
  /**
   * The release version
   */
  'version'?: (string);
  /**
   * The release commit
   */
  'commit_id'?: (string);
  /**
   * The release date
   */
  'build_date'?: (_google_protobuf_Timestamp);
}

/**
 * ApplicationMetadata is produced by the GetMetadata rpc and provides details
 * about the backand application
 */
export interface ApplicationMetadata__Output {
  /**
   * The name of the application
   */
  'name': (string);
  /**
   * The release version
   */
  'version': (string);
  /**
   * The release commit
   */
  'commit_id': (string);
  /**
   * The release date
   */
  'build_date'?: (_google_protobuf_Timestamp__Output);
}
