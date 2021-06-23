// Original file: proto/license.proto

import type * as grpc from '@grpc/grpc-js';
import type {
  RenewLicenseRequest as _build_stack_license_v1beta1_RenewLicenseRequest,
  RenewLicenseRequest__Output as _build_stack_license_v1beta1_RenewLicenseRequest__Output,
} from '../../../../build/stack/license/v1beta1/RenewLicenseRequest';
import type {
  RenewLicenseResponse as _build_stack_license_v1beta1_RenewLicenseResponse,
  RenewLicenseResponse__Output as _build_stack_license_v1beta1_RenewLicenseResponse__Output,
} from '../../../../build/stack/license/v1beta1/RenewLicenseResponse';

export interface LicensesClient extends grpc.Client {
  Renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  Renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    metadata: grpc.Metadata,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    metadata: grpc.Metadata,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    options: grpc.CallOptions,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
  renew(
    argument: _build_stack_license_v1beta1_RenewLicenseRequest,
    callback: (
      error?: grpc.ServiceError,
      result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output
    ) => void
  ): grpc.ClientUnaryCall;
}

export interface LicensesHandlers extends grpc.UntypedServiceImplementation {
  Renew: grpc.handleUnaryCall<
    _build_stack_license_v1beta1_RenewLicenseRequest__Output,
    _build_stack_license_v1beta1_RenewLicenseResponse
  >;
}
