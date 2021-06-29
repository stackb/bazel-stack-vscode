// Original file: proto/codesearch.proto

import type { Timestamp as _google_protobuf_Timestamp, Timestamp__Output as _google_protobuf_Timestamp__Output } from '../../../../google/protobuf/Timestamp';
import type { ServerInfo as _livegrep_ServerInfo, ServerInfo__Output as _livegrep_ServerInfo__Output } from '../../../../livegrep/ServerInfo';
import type { Long } from '@grpc/proto-loader';

/**
 * A scope is a definition of a set of files
 */
export interface Scope {
  /**
   * a name to uniquely identify this set of files
   */
  'name'?: (string);
  /**
   * a URI that defines the set of files to be used for the search.
   */
  'uri'?: (string);
  /**
   * the number of files in the scope
   */
  'size'?: (number | string | Long);
  /**
   * a timestamp to indicate when this was last indexed
   */
  'createdAt'?: (_google_protobuf_Timestamp);
  /**
   * The ServerInfo for this scope
   */
  'info'?: (_livegrep_ServerInfo);
}

/**
 * A scope is a definition of a set of files
 */
export interface Scope__Output {
  /**
   * a name to uniquely identify this set of files
   */
  'name': (string);
  /**
   * a URI that defines the set of files to be used for the search.
   */
  'uri': (string);
  /**
   * the number of files in the scope
   */
  'size': (Long);
  /**
   * a timestamp to indicate when this was last indexed
   */
  'createdAt'?: (_google_protobuf_Timestamp__Output);
  /**
   * The ServerInfo for this scope
   */
  'info'?: (_livegrep_ServerInfo__Output);
}
