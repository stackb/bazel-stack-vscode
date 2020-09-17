// Original file: proto/nucleate.proto

import * as grpc from '@grpc/grpc-js'
import { CancelSubscriptionRequest as _build_stack_nucleate_v1beta_CancelSubscriptionRequest, CancelSubscriptionRequest__Output as _build_stack_nucleate_v1beta_CancelSubscriptionRequest__Output } from '../../../../build/stack/nucleate/v1beta/CancelSubscriptionRequest';
import { CancelSubscriptionResponse as _build_stack_nucleate_v1beta_CancelSubscriptionResponse, CancelSubscriptionResponse__Output as _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output } from '../../../../build/stack/nucleate/v1beta/CancelSubscriptionResponse';
import { CreateSubscriptionRequest as _build_stack_nucleate_v1beta_CreateSubscriptionRequest, CreateSubscriptionRequest__Output as _build_stack_nucleate_v1beta_CreateSubscriptionRequest__Output } from '../../../../build/stack/nucleate/v1beta/CreateSubscriptionRequest';
import { Subscription as _build_stack_nucleate_v1beta_Subscription, Subscription__Output as _build_stack_nucleate_v1beta_Subscription__Output } from '../../../../build/stack/nucleate/v1beta/Subscription';

export interface SubscriptionsClient extends grpc.Client {
  CancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  CancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  CancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  CancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  cancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  cancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  cancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  cancelSubscription(argument: _build_stack_nucleate_v1beta_CancelSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output) => void): grpc.ClientUnaryCall;
  
  CreateSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  CreateSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  CreateSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  CreateSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  createSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  createSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  createSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  createSubscription(argument: _build_stack_nucleate_v1beta_CreateSubscriptionRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Subscription__Output) => void): grpc.ClientUnaryCall;
  
}

export interface SubscriptionsHandlers {
  CancelSubscription(call: grpc.ServerUnaryCall<_build_stack_nucleate_v1beta_CancelSubscriptionRequest, _build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output>, callback: grpc.sendUnaryData<_build_stack_nucleate_v1beta_CancelSubscriptionResponse__Output>): void;
  
  CreateSubscription(call: grpc.ServerUnaryCall<_build_stack_nucleate_v1beta_CreateSubscriptionRequest, _build_stack_nucleate_v1beta_Subscription__Output>, callback: grpc.sendUnaryData<_build_stack_nucleate_v1beta_Subscription__Output>): void;
  
}
