// Original file: proto/livegrep.proto

import * as grpc from '@grpc/grpc-js'
import { CodeSearchResult as _livegrep_CodeSearchResult, CodeSearchResult__Output as _livegrep_CodeSearchResult__Output } from '../livegrep/CodeSearchResult';
import { InfoRequest as _livegrep_InfoRequest, InfoRequest__Output as _livegrep_InfoRequest__Output } from '../livegrep/InfoRequest';
import { Query as _livegrep_Query, Query__Output as _livegrep_Query__Output } from '../livegrep/Query';
import { ServerInfo as _livegrep_ServerInfo, ServerInfo__Output as _livegrep_ServerInfo__Output } from '../livegrep/ServerInfo';

export interface CodeSearchClient extends grpc.Client {
  Info(argument: _livegrep_InfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  Info(argument: _livegrep_InfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  Info(argument: _livegrep_InfoRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  Info(argument: _livegrep_InfoRequest, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  info(argument: _livegrep_InfoRequest, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  info(argument: _livegrep_InfoRequest, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  info(argument: _livegrep_InfoRequest, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  info(argument: _livegrep_InfoRequest, callback: (error?: grpc.ServiceError, result?: _livegrep_ServerInfo__Output) => void): grpc.ClientUnaryCall;
  
  Search(argument: _livegrep_Query, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  Search(argument: _livegrep_Query, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  Search(argument: _livegrep_Query, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  Search(argument: _livegrep_Query, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  search(argument: _livegrep_Query, metadata: grpc.Metadata, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  search(argument: _livegrep_Query, metadata: grpc.Metadata, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  search(argument: _livegrep_Query, options: grpc.CallOptions, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  search(argument: _livegrep_Query, callback: (error?: grpc.ServiceError, result?: _livegrep_CodeSearchResult__Output) => void): grpc.ClientUnaryCall;
  
}

export interface CodeSearchHandlers extends grpc.UntypedServiceImplementation {
  Info(call: grpc.ServerUnaryCall<_livegrep_InfoRequest__Output, _livegrep_ServerInfo>, callback: grpc.sendUnaryData<_livegrep_ServerInfo>): void;
  
  Search(call: grpc.ServerUnaryCall<_livegrep_Query__Output, _livegrep_CodeSearchResult>, callback: grpc.sendUnaryData<_livegrep_CodeSearchResult>): void;
  
}
