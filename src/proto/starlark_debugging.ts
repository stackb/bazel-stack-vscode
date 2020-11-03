import type * as grpc from '@grpc/grpc-js';
import type { ServiceDefinition, EnumTypeDefinition, MessageTypeDefinition } from '@grpc/proto-loader';


type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new(...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  starlark_debugging: {
    Breakpoint: MessageTypeDefinition
    ContinueExecutionRequest: MessageTypeDefinition
    ContinueExecutionResponse: MessageTypeDefinition
    DebugEvent: MessageTypeDefinition
    DebugRequest: MessageTypeDefinition
    Error: MessageTypeDefinition
    EvaluateRequest: MessageTypeDefinition
    EvaluateResponse: MessageTypeDefinition
    Frame: MessageTypeDefinition
    GetChildrenRequest: MessageTypeDefinition
    GetChildrenResponse: MessageTypeDefinition
    ListFramesRequest: MessageTypeDefinition
    ListFramesResponse: MessageTypeDefinition
    Location: MessageTypeDefinition
    PauseReason: EnumTypeDefinition
    PauseThreadRequest: MessageTypeDefinition
    PauseThreadResponse: MessageTypeDefinition
    PausedThread: MessageTypeDefinition
    Scope: MessageTypeDefinition
    SetBreakpointsRequest: MessageTypeDefinition
    SetBreakpointsResponse: MessageTypeDefinition
    StartDebuggingRequest: MessageTypeDefinition
    StartDebuggingResponse: MessageTypeDefinition
    Stepping: EnumTypeDefinition
    ThreadContinuedEvent: MessageTypeDefinition
    ThreadPausedEvent: MessageTypeDefinition
    Value: MessageTypeDefinition
  }
}

