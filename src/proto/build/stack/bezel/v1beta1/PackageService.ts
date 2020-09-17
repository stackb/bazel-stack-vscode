// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { ListPackagesRequest as _build_stack_bezel_v1beta1_ListPackagesRequest, ListPackagesRequest__Output as _build_stack_bezel_v1beta1_ListPackagesRequest__Output } from '../../../../build/stack/bezel/v1beta1/ListPackagesRequest';
import { ListPackagesResponse as _build_stack_bezel_v1beta1_ListPackagesResponse, ListPackagesResponse__Output as _build_stack_bezel_v1beta1_ListPackagesResponse__Output } from '../../../../build/stack/bezel/v1beta1/ListPackagesResponse';
import { ListRulesRequest as _build_stack_bezel_v1beta1_ListRulesRequest, ListRulesRequest__Output as _build_stack_bezel_v1beta1_ListRulesRequest__Output } from '../../../../build/stack/bezel/v1beta1/ListRulesRequest';
import { ListRulesResponse as _build_stack_bezel_v1beta1_ListRulesResponse, ListRulesResponse__Output as _build_stack_bezel_v1beta1_ListRulesResponse__Output } from '../../../../build/stack/bezel/v1beta1/ListRulesResponse';

/**
 * PackageService defines an API for listing packages and rules.
 */
export interface PackageServiceClient extends grpc.Client {
  ListPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  ListPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  ListPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  ListPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  listPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  listPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  listPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  listPackages(argument: _build_stack_bezel_v1beta1_ListPackagesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output) => void): grpc.ClientUnaryCall;
  
  ListRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  ListRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  ListRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  ListRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  listRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  listRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  listRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  listRules(argument: _build_stack_bezel_v1beta1_ListRulesRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * PackageService defines an API for listing packages and rules.
 */
export interface PackageServiceHandlers {
  ListPackages(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_ListPackagesRequest, _build_stack_bezel_v1beta1_ListPackagesResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_ListPackagesResponse__Output>): void;
  
  ListRules(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_ListRulesRequest, _build_stack_bezel_v1beta1_ListRulesResponse__Output>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_ListRulesResponse__Output>): void;
  
}
