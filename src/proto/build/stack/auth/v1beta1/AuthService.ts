// Original file: proto/auth.proto

import type * as grpc from '@grpc/grpc-js'
import type { LoginRequest as _build_stack_auth_v1beta1_LoginRequest, LoginRequest__Output as _build_stack_auth_v1beta1_LoginRequest__Output } from '../../../../build/stack/auth/v1beta1/LoginRequest';
import type { LoginResponse as _build_stack_auth_v1beta1_LoginResponse, LoginResponse__Output as _build_stack_auth_v1beta1_LoginResponse__Output } from '../../../../build/stack/auth/v1beta1/LoginResponse';
import type { PasswordResetRequest as _build_stack_auth_v1beta1_PasswordResetRequest, PasswordResetRequest__Output as _build_stack_auth_v1beta1_PasswordResetRequest__Output } from '../../../../build/stack/auth/v1beta1/PasswordResetRequest';
import type { PasswordResetResponse as _build_stack_auth_v1beta1_PasswordResetResponse, PasswordResetResponse__Output as _build_stack_auth_v1beta1_PasswordResetResponse__Output } from '../../../../build/stack/auth/v1beta1/PasswordResetResponse';
import type { RegisterRequest as _build_stack_auth_v1beta1_RegisterRequest, RegisterRequest__Output as _build_stack_auth_v1beta1_RegisterRequest__Output } from '../../../../build/stack/auth/v1beta1/RegisterRequest';

export interface AuthServiceClient extends grpc.Client {
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Login(argument: _build_stack_auth_v1beta1_LoginRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  login(argument: _build_stack_auth_v1beta1_LoginRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  PasswordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  passwordReset(argument: _build_stack_auth_v1beta1_PasswordResetRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_PasswordResetResponse__Output) => void): grpc.ClientUnaryCall;
  
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  Register(argument: _build_stack_auth_v1beta1_RegisterRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  register(argument: _build_stack_auth_v1beta1_RegisterRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_auth_v1beta1_LoginResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface AuthServiceHandlers extends grpc.UntypedServiceImplementation {
  Login: grpc.handleUnaryCall<_build_stack_auth_v1beta1_LoginRequest__Output, _build_stack_auth_v1beta1_LoginResponse>;
  
  PasswordReset: grpc.handleUnaryCall<_build_stack_auth_v1beta1_PasswordResetRequest__Output, _build_stack_auth_v1beta1_PasswordResetResponse>;
  
  Register: grpc.handleUnaryCall<_build_stack_auth_v1beta1_RegisterRequest__Output, _build_stack_auth_v1beta1_LoginResponse>;
  
}
