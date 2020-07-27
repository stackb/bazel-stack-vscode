// Original file: src/proto/stardoc_output/stardoc_output.proto

import * as grpc from '@grpc/grpc-js'
import { GetModuleInfoRequest as _stardoc_output_GetModuleInfoRequest, GetModuleInfoRequest__Output as _stardoc_output_GetModuleInfoRequest__Output } from '../stardoc_output/GetModuleInfoRequest';
import { ModuleInfo as _stardoc_output_ModuleInfo, ModuleInfo__Output as _stardoc_output_ModuleInfo__Output } from '../stardoc_output/ModuleInfo';

/**
 * Modules service implementation provides modules from module requests.
 */
export interface ModulesClient extends grpc.Client {
  GetModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  GetModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  GetModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  GetModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  getModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  getModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  getModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  getModuleInfo(argument: _stardoc_output_GetModuleInfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _stardoc_output_ModuleInfo__Output) => void): grpc.ClientUnaryCall;
  
}

/**
 * Modules service implementation provides modules from module requests.
 */
export interface ModulesHandlers {
  GetModuleInfo(call: grpc.ServerUnaryCall<_stardoc_output_GetModuleInfoRequest, _stardoc_output_ModuleInfo__Output>, callback: grpc.sendUnaryData<_stardoc_output_ModuleInfo__Output>): void;
  
}
