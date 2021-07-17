// Original file: proto/nucleate.proto

import type { Long } from '@grpc/proto-loader';

export interface Plan {
  id?: string;
  name?: string;
  amount?: number | string | Long;
  currency?: string;
  interval?: string;
  description?: string;
  trialPeriodDays?: number;
  primaryFeature?: string;
}

export interface Plan__Output {
  id: string;
  name: string;
  amount: Long;
  currency: string;
  interval: string;
  description: string;
  trialPeriodDays: number;
  primaryFeature: string;
}
