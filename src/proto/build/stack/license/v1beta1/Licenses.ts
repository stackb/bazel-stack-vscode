// Original file: proto/license.proto

import * as grpc from '@grpc/grpc-js'
import { LicenseStatusRequest as _build_stack_license_v1beta1_LicenseStatusRequest, LicenseStatusRequest__Output as _build_stack_license_v1beta1_LicenseStatusRequest__Output } from '../../../../build/stack/license/v1beta1/LicenseStatusRequest';
import { LicenseStatusResponse as _build_stack_license_v1beta1_LicenseStatusResponse, LicenseStatusResponse__Output as _build_stack_license_v1beta1_LicenseStatusResponse__Output } from '../../../../build/stack/license/v1beta1/LicenseStatusResponse';
import { RenewLicenseRequest as _build_stack_license_v1beta1_RenewLicenseRequest, RenewLicenseRequest__Output as _build_stack_license_v1beta1_RenewLicenseRequest__Output } from '../../../../build/stack/license/v1beta1/RenewLicenseRequest';
import { RenewLicenseResponse as _build_stack_license_v1beta1_RenewLicenseResponse, RenewLicenseResponse__Output as _build_stack_license_v1beta1_RenewLicenseResponse__Output } from '../../../../build/stack/license/v1beta1/RenewLicenseResponse';

export interface LicensesClient extends grpc.Client {
  Renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  Renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  Renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  Renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  renew(argument: _build_stack_license_v1beta1_RenewLicenseRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_RenewLicenseResponse__Output) => void): grpc.ClientUnaryCall;
  
  Status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  Status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  Status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  Status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  status(argument: _build_stack_license_v1beta1_LicenseStatusRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_license_v1beta1_LicenseStatusResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface LicensesHandlers {
  Renew(call: grpc.ServerUnaryCall<_build_stack_license_v1beta1_RenewLicenseRequest, _build_stack_license_v1beta1_RenewLicenseResponse__Output>, callback: grpc.sendUnaryData<_build_stack_license_v1beta1_RenewLicenseResponse__Output>): void;
  
  Status(call: grpc.ServerUnaryCall<_build_stack_license_v1beta1_LicenseStatusRequest, _build_stack_license_v1beta1_LicenseStatusResponse__Output>, callback: grpc.sendUnaryData<_build_stack_license_v1beta1_LicenseStatusResponse__Output>): void;
  
}