// Original file: proto/nucleate.proto

import * as grpc from '@grpc/grpc-js'
import { Customer as _build_stack_nucleate_v1beta_Customer, Customer__Output as _build_stack_nucleate_v1beta_Customer__Output } from '../../../../build/stack/nucleate/v1beta/Customer';
import { GetCustomerRequest as _build_stack_nucleate_v1beta_GetCustomerRequest, GetCustomerRequest__Output as _build_stack_nucleate_v1beta_GetCustomerRequest__Output } from '../../../../build/stack/nucleate/v1beta/GetCustomerRequest';

export interface CustomersClient extends grpc.Client {
  Get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  Get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  get(argument: _build_stack_nucleate_v1beta_GetCustomerRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_nucleate_v1beta_Customer__Output) => void): grpc.ClientUnaryCall;
  
}

export interface CustomersHandlers extends grpc.UntypedServiceImplementation {
  Get(call: grpc.ServerUnaryCall<_build_stack_nucleate_v1beta_GetCustomerRequest__Output, _build_stack_nucleate_v1beta_Customer>, callback: grpc.sendUnaryData<_build_stack_nucleate_v1beta_Customer>): void;
  
}
