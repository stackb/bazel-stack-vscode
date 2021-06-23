import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';

import type { LanguageServerProtocolClient as _build_stack_lsp_v1beta1_LanguageServerProtocolClient } from './build/stack/lsp/v1beta1/LanguageServerProtocol';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    stack: {
      lsp: {
        v1beta1: {
          BazelInfoRequest: MessageTypeDefinition
          BazelInfoResponse: MessageTypeDefinition
          Label: MessageTypeDefinition
          LabelKindRange: MessageTypeDefinition
          LabelKindRangeRequest: MessageTypeDefinition
          LabelKindRangeResponse: MessageTypeDefinition
          LanguageServerProtocol: SubtypeConstructor<typeof grpc.Client, _build_stack_lsp_v1beta1_LanguageServerProtocolClient> & { service: ServiceDefinition }
          Position: MessageTypeDefinition
          Range: MessageTypeDefinition
          TextDocument: MessageTypeDefinition
        }
      }
    }
  }
}

