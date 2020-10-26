// Original file: proto/livegrep.proto

import type { Bounds as _livegrep_Bounds, Bounds__Output as _livegrep_Bounds__Output } from '../livegrep/Bounds';

export interface FileResult {
  'tree'?: (string);
  'version'?: (string);
  'path'?: (string);
  'bounds'?: (_livegrep_Bounds);
}

export interface FileResult__Output {
  'tree': (string);
  'version': (string);
  'path': (string);
  'bounds'?: (_livegrep_Bounds__Output);
}
