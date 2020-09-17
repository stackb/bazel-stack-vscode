// Original file: proto/auth.proto

import * as grpc from '@grpc/grpc-js'
import { LoginRequest as _build_stack_auth_v1beta1_LoginRequest, LoginRequest__Output as _build_stack_auth_v1beta1_LoginRequest__Output } from '../../../../build/stack/auth/v1beta1/LoginRequest';
import { LoginResponse as _build_stack_auth_v1beta1_LoginResponse, LoginResponse__Output as _build_stack_auth_v1beta1_LoginResponse__Output } from '../../../../build/stack/auth/v1beta1/LoginResponse';
import { PasswordResetRequest as _build_stack_auth_v1beta1_PasswordResetRequest, PasswordResetRequest__Output as _build_stack_auth_v1beta1_PasswordResetRequest__Output } from '../../../../build/stack/auth/v1beta1/PasswordResetRequest';
import { PasswordResetResponse as _build_stack_auth_v1beta1_PasswordResetResponse, PasswordResetResponse__Output as _build_stack_auth_v1beta1_PasswordResetResponse__Output } from '../../../../build/stack/auth/v1beta1/PasswordResetResponse';
import { RegisterRequest as _build_stack_auth_v1beta1_RegisterRequest, RegisterRequest__Output as _build_stack_auth_v1beta1_RegisterRequest__Output } from '../../../../build/stack/auth/v1beta1/RegisterRequest';

export interface AuthServiceClient extends grpc.Client {
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface AuthServiceHandlers {
  Login(call: grpc.ServerUnaryCall<_build_stack_auth_v1beta1_LoginRequest, _build_stack_auth_v1beta1_LoginResponse__Output>, callback: grpc.sendUnaryData<_build_stack_auth_v1beta1_LoginResponse__Output>): void;
  
  PasswordReset(call: grpc.ServerUnaryCall<_build_stack_auth_v1beta1_PasswordResetRequest, _build_stack_auth_v1beta1_PasswordResetResponse__Output>, callback: grpc.sendUnaryData<_build_stack_auth_v1beta1_PasswordResetResponse__Output>): void;
  
  Register(call: grpc.ServerUnaryCall<_build_stack_auth_v1beta1_RegisterRequest, _build_stack_auth_v1beta1_LoginResponse__Output>, callback: grpc.sendUnaryData<_build_stack_auth_v1beta1_LoginResponse__Output>): void;
  
}
