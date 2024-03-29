// Original file: null

import type {
  UninterpretedOption as _google_protobuf_UninterpretedOption,
  UninterpretedOption__Output as _google_protobuf_UninterpretedOption__Output,
} from '../../google/protobuf/UninterpretedOption';

export interface ServiceOptions {
  deprecated?: boolean;
  uninterpretedOption?: _google_protobuf_UninterpretedOption[];
  '.google.api.defaultHost'?: string;
  '.google.api.oauthScopes'?: string;
}

export interface ServiceOptions__Output {
  deprecated: boolean;
  uninterpretedOption: _google_protobuf_UninterpretedOption__Output[];
  '.google.api.defaultHost': string;
  '.google.api.oauthScopes': string;
}
