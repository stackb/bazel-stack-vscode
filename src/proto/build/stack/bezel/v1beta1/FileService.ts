// Original file: proto/bzl.proto

import * as grpc from '@grpc/grpc-js'
import { FileDownloadRequest as _build_stack_bezel_v1beta1_FileDownloadRequest, FileDownloadRequest__Output as _build_stack_bezel_v1beta1_FileDownloadRequest__Output } from '../../../../build/stack/bezel/v1beta1/FileDownloadRequest';
import { FileDownloadResponse as _build_stack_bezel_v1beta1_FileDownloadResponse, FileDownloadResponse__Output as _build_stack_bezel_v1beta1_FileDownloadResponse__Output } from '../../../../build/stack/bezel/v1beta1/FileDownloadResponse';

export interface FileServiceClient extends grpc.Client {
  Download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  Download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  Download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  Download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  download(argument: _build_stack_bezel_v1beta1_FileDownloadRequest, callback: (error?: grpc.ServiceError, result?: _build_stack_bezel_v1beta1_FileDownloadResponse__Output) => void): grpc.ClientUnaryCall;
  
}

export interface FileServiceHandlers extends grpc.UntypedServiceImplementation {
  Download(call: grpc.ServerUnaryCall<_build_stack_bezel_v1beta1_FileDownloadRequest__Output, _build_stack_bezel_v1beta1_FileDownloadResponse>, callback: grpc.sendUnaryData<_build_stack_bezel_v1beta1_FileDownloadResponse>): void;
  
}
