import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type { OperationsClient as _google_longrunning_OperationsClient, OperationsDefinition as _google_longrunning_OperationsDefinition } from './google/longrunning/Operations';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  google: {
    api: {
      CustomHttpPattern: MessageTypeDefinition
      Http: MessageTypeDefinition
      HttpRule: MessageTypeDefinition
    }
    longrunning: {
      CancelOperationRequest: MessageTypeDefinition
      DeleteOperationRequest: MessageTypeDefinition
      GetOperationRequest: MessageTypeDefinition
      ListOperationsRequest: MessageTypeDefinition
      ListOperationsResponse: MessageTypeDefinition
      Operation: MessageTypeDefinition
      OperationInfo: MessageTypeDefinition
      /**
       * Manages long-running operations with an API service.
       * 
       * When an API method normally takes long time to complete, it can be designed
       * to return [Operation][google.longrunning.Operation] to the client, and the client can use this
       * interface to receive the real response asynchronously by polling the
       * operation resource, or pass the operation resource to another API (such as
       * Google Cloud Pub/Sub API) to receive the response.  Any API service that
       * returns long-running operations should implement the `Operations` interface
       * so developers can have a consistent client experience.
       */
      Operations: SubtypeConstructor<typeof grpc.Client, _google_longrunning_OperationsClient> & { service: _google_longrunning_OperationsDefinition }
      WaitOperationRequest: MessageTypeDefinition
    }
    protobuf: {
      Any: MessageTypeDefinition
      DescriptorProto: MessageTypeDefinition
      Duration: MessageTypeDefinition
      Empty: MessageTypeDefinition
      EnumDescriptorProto: MessageTypeDefinition
      EnumOptions: MessageTypeDefinition
      EnumValueDescriptorProto: MessageTypeDefinition
      EnumValueOptions: MessageTypeDefinition
      FieldDescriptorProto: MessageTypeDefinition
      FieldOptions: MessageTypeDefinition
      FileDescriptorProto: MessageTypeDefinition
      FileDescriptorSet: MessageTypeDefinition
      FileOptions: MessageTypeDefinition
      GeneratedCodeInfo: MessageTypeDefinition
      MessageOptions: MessageTypeDefinition
      MethodDescriptorProto: MessageTypeDefinition
      MethodOptions: MessageTypeDefinition
      OneofDescriptorProto: MessageTypeDefinition
      OneofOptions: MessageTypeDefinition
      ServiceDescriptorProto: MessageTypeDefinition
      ServiceOptions: MessageTypeDefinition
      SourceCodeInfo: MessageTypeDefinition
      UninterpretedOption: MessageTypeDefinition
    }
    rpc: {
      Status: MessageTypeDefinition
    }
  }
}

