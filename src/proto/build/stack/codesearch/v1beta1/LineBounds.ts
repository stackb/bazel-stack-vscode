// Original file: proto/codesearch.proto

import type {
  Bounds as _livegrep_Bounds,
  Bounds__Output as _livegrep_Bounds__Output,
} from '../../../../livegrep/Bounds';
import type { Long } from '@grpc/proto-loader';

/**
 * the set of context lines and matched lines.  The line numbers should be
 * sorted prior to display.  If a LineBound has no Bounds ranges, it is a
 * contextual line.
 */
export interface LineBounds {
  /**
   * the line number that this line represents
   */
  lineNumber?: number | string | Long;
  /**
   * the content of the line
   */
  line?: string;
  /**
   * optional set of bounding ranges for the line.  The server should not
   * provide overlapping ranges.
   */
  bounds?: _livegrep_Bounds[];
}

/**
 * the set of context lines and matched lines.  The line numbers should be
 * sorted prior to display.  If a LineBound has no Bounds ranges, it is a
 * contextual line.
 */
export interface LineBounds__Output {
  /**
   * the line number that this line represents
   */
  lineNumber: Long;
  /**
   * the content of the line
   */
  line: string;
  /**
   * optional set of bounding ranges for the line.  The server should not
   * provide overlapping ranges.
   */
  bounds: _livegrep_Bounds__Output[];
}
