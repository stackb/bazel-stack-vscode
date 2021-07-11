// Original file: proto/livegrep.proto

import type { Bounds as _livegrep_Bounds, Bounds__Output as _livegrep_Bounds__Output } from '../livegrep/Bounds';
import type { Long } from '@grpc/proto-loader';

export interface SearchResult {
  'tree'?: (string);
  'version'?: (string);
  'path'?: (string);
  'lineNumber'?: (number | string | Long);
  'contextBefore'?: (string)[];
  'contextAfter'?: (string)[];
  'bounds'?: (_livegrep_Bounds | null);
  'line'?: (string);
}

export interface SearchResult__Output {
  'tree': (string);
  'version': (string);
  'path': (string);
  'lineNumber': (Long);
  'contextBefore': (string)[];
  'contextAfter': (string)[];
  'bounds': (_livegrep_Bounds__Output | null);
  'line': (string);
}
