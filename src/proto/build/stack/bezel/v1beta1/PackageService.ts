// Original file: proto/bzl.proto

import type * as grpc from '@grpc/grpc-js';
import type { MethodDefinition } from '@grpc/proto-loader';
import type {
  ListPackagesRequest as _build_stack_bezel_v1beta1_ListPackagesRequest,
  ListPackagesRequest__Output as _build_stack_bezel_v1beta1_ListPackagesRequest__Output,
} from '../../../../build/stack/bezel/v1beta1/ListPackagesRequest';
import type {
  ListPackagesResponse as _build_stack_bezel_v1beta1_ListPackagesResponse,
  ListPackagesResponse__Output as _build_stack_bezel_v1beta1_ListPackagesResponse__Output,
} from '../../../../build/stack/bezel/v1beta1/ListPackagesResponse';
import type {
  ListRulesRequest as _build_stack_bezel_v1beta1_ListRulesRequest,
  ListRulesRequest__Output as _build_stack_bezel_v1beta1_ListRulesRequest__Output,
} from '../../../../build/stack/bezel/v1beta1/ListRulesRequest';
import type {
  ListRulesResponse as _build_stack_bezel_v1beta1_ListRulesResponse,
  ListRulesResponse__Output as _build_stack_bezel_v1beta1_ListRulesResponse__Output,
} from '../../../../build/stack/bezel/v1beta1/ListRulesResponse';

/**
 * PackageService defines an API for listing packages and rules.
 */
export interface PackageServiceClient extends grpc.Client {
  ListPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listPackages(
    argument: _build_stack_bezel_v1beta1_ListPackagesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListPackagesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;

  ListRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  ListRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  listRules(
    argument: _build_stack_bezel_v1beta1_ListRulesRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_bezel_v1beta1_ListRulesResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

/**
 * PackageService defines an API for listing packages and rules.
 */
export interface PackageServiceHandlers extends grpc.UntypedServiceImplementation {
  ListPackages: grpc.handleUnaryCall<
    _build_stack_bezel_v1beta1_ListPackagesRequest__Output,
    _build_stack_bezel_v1beta1_ListPackagesResponse
  >;

  ListRules: grpc.handleUnaryCall<
    _build_stack_bezel_v1beta1_ListRulesRequest__Output,
    _build_stack_bezel_v1beta1_ListRulesResponse
  >;
}

export interface PackageServiceDefinition extends grpc.ServiceDefinition {
  ListPackages: MethodDefinition<
    _build_stack_bezel_v1beta1_ListPackagesRequest,
    _build_stack_bezel_v1beta1_ListPackagesResponse,
    _build_stack_bezel_v1beta1_ListPackagesRequest__Output,
    _build_stack_bezel_v1beta1_ListPackagesResponse__Output
  >;
  ListRules: MethodDefinition<
    _build_stack_bezel_v1beta1_ListRulesRequest,
    _build_stack_bezel_v1beta1_ListRulesResponse,
    _build_stack_bezel_v1beta1_ListRulesRequest__Output,
    _build_stack_bezel_v1beta1_ListRulesResponse__Output
  >;
}
