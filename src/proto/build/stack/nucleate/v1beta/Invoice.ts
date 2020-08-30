// Original file: proto/nucleate.proto

import { Long } from '@grpc/proto-loader';

export interface Invoice {
  'id'?: (string);
  'amountPaid'?: (number | string | Long);
  'amountDue'?: (number | string | Long);
  'created'?: (number | string | Long);
  'attempted'?: (boolean);
  'paid'?: (boolean);
  'status'?: (string);
  'total'?: (number | string | Long);
}

export interface Invoice__Output {
  'id': (string);
  'amountPaid': (Long);
  'amountDue': (Long);
  'created': (Long);
  'attempted': (boolean);
  'paid': (boolean);
  'status': (string);
  'total': (Long);
}
