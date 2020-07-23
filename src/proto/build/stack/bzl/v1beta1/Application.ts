// Original file: src/bezel/client/application.proto

import * as grpc from '@grpc/grpc-js'
import { ApplicationMetadata as _build_stack_bzl_v1beta1_ApplicationMetadata, ApplicationMetadata__Output as _build_stack_bzl_v1beta1_ApplicationMetadata__Output } from '../../../../build/stack/bzl/v1beta1/ApplicationMetadata';
import { GetApplicationMetadataRequest as _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, GetApplicationMetadataRequest__Output as _build_stack_bzl_v1beta1_GetApplicationMetadataRequest__Output } from '../../../../build/stack/bzl/v1beta1/GetApplicationMetadataRequest';

/**
 * The Application service provides metadata about the bzl application
 */
export interface ApplicationClient extends grpc.Client {
  GetApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  GetApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  GetApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  GetApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  getApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  getApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  getApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  getApplicationMetadata(argument: _build_stack_bzl_v1beta1_GetApplicationMetadataRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bzl_v1beta1_ApplicationMetadata__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * The Application service provides metadata about the bzl application
 */
export interface ApplicationHandlers {
  GetApplicationMetadata(call: grpc.ServerUnaryCall<_build_stack_bzl_v1beta1_GetApplicationMetadataRequest, _build_stack_bzl_v1beta1_ApplicationMetadata__Output>, callback: grpc.sendUnaryData<_build_stack_bzl_v1beta1_ApplicationMetadata__Output>): void;
  
}
