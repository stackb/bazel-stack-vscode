// Original file: proto/nucleate.proto

import type { Long } from '@grpc/proto-loader';

export interface Subscription {
  'customerId'?: (string);
  'planId'?: (string);
  'id'?: (string);
  'name'?: (string);
  'status'?: (string);
  'schedule'?: (string);
  'quantity'?: (number);
  'startDate'?: (number | string | Long);
  'trialStart'?: (number | string | Long);
  'trialEnd'?: (number | string | Long);
  'created'?: (number | string | Long);
  'currentPeriodStart'?: (number | string | Long);
  'currentPeriodEnd'?: (number | string | Long);
  'planAmount'?: (number | string | Long);
}

export interface Subscription__Output {
  'customerId': (string);
  'planId': (string);
  'id': (string);
  'name': (string);
  'status': (string);
  'schedule': (string);
  'quantity': (number);
  'startDate': (Long);
  'trialStart': (Long);
  'trialEnd': (Long);
  'created': (Long);
  'currentPeriodStart': (Long);
  'currentPeriodEnd': (Long);
  'planAmount': (Long);
}
