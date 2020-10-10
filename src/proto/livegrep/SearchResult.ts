// Original file: proto/livegrep.proto

import { Bounds as _livegrep_Bounds, Bounds__Output as _livegrep_Bounds__Output } from '../livegrep/Bounds';
import { Long } from '@grpc/proto-loader';

export interface SearchResult {
  'tree'?: (string);
  'version'?: (string);
  'path'?: (string);
  'lineNumber'?: (number | string | Long);
  'contextBefore'?: (string)[];
  'contextAfter'?: (string)[];
  'bounds'?: (_livegrep_Bounds);
  'line'?: (string);
}

export interface SearchResult__Output {
  'tree': (string);
  'version': (string);
  'path': (string);
  'lineNumber': (Long);
  'contextBefore': (string)[];
  'contextAfter': (string)[];
  'bounds'?: (_livegrep_Bounds__Output);
  'line': (string);
}
