// Original file: proto/bzl.proto

import { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';
import { Long } from '@grpc/proto-loader';

export interface FileDownloadResponse {
  /**
   * URL where the file can be downloaded
   */
  'uri'?: (string);
  /**
   * The SHA256 of the artifact
   */
  'sha256'?: (string);
  /**
   * The file size
   */
  'size'?: (number | string | Long);
  /**
   * The file mode
   */
  'mode'?: (number);
  /**
   * The file modification time
   */
  'modifiedTime'?: (_google_protobuf_Timestamp);
}

export interface FileDownloadResponse__Output {
  /**
   * URL where the file can be downloaded
   */
  'uri': (string);
  /**
   * The SHA256 of the artifact
   */
  'sha256': (string);
  /**
   * The file size
   */
  'size': (Long);
  /**
   * The file mode
   */
  'mode': (number);
  /**
   * The file modification time
   */
  'modifiedTime'?: (_google_protobuf_Timestamp__Output);
}
