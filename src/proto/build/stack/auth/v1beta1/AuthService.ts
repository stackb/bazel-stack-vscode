// Original file: proto/auth.proto

import * as grpc from '@grpc/grpc-js'
import { LoginRequest as _build_stack_auth_v1beta1_LoginRequest, LoginRequest__Output as _build_stack_auth_v1beta1_LoginRequest__Output } from '../../../../build/stack/auth/v1beta1/LoginRequest';
import { LoginResponse as _build_stack_auth_v1beta1_LoginResponse, LoginResponse__Output as _build_stack_auth_v1beta1_LoginResponse__Output } from '../../../../build/stack/auth/v1beta1/LoginResponse';

export interface AuthServiceClient extends grpc.Client {
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface AuthServiceHandlers {
  Login(call: grpc.ServerUnaryCall<_build_stack_auth_v1beta1_LoginRequest, _build_stack_auth_v1beta1_LoginResponse__Output>, callback: grpc.sendUnaryData<_build_stack_auth_v1beta1_LoginResponse__Output>): void;
  
}
