// Original file: proto/nucleate.proto

import { Subscription as _build_stack_nucleate_v1beta_Subscription, Subscription__Output as _build_stack_nucleate_v1beta_Subscription__Output } from '../../../../build/stack/nucleate/v1beta/Subscription';

export interface Customer {
  'id'?: (string);
  'email'?: (string);
  'subscription'?: (_build_stack_nucleate_v1beta_Subscription)[];
}

export interface Customer__Output {
  'id': (string);
  'email': (string);
  'subscription': (_build_stack_nucleate_v1beta_Subscription__Output)[];
}
