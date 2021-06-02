// Original file: proto/starlark_debugging.proto

import type { Error as _starlark_debugging_Error, Error__Output as _starlark_debugging_Error__Output } from '../starlark_debugging/Error';
import type { SetBreakpointsResponse as _starlark_debugging_SetBreakpointsResponse, SetBreakpointsResponse__Output as _starlark_debugging_SetBreakpointsResponse__Output } from '../starlark_debugging/SetBreakpointsResponse';
import type { ContinueExecutionResponse as _starlark_debugging_ContinueExecutionResponse, ContinueExecutionResponse__Output as _starlark_debugging_ContinueExecutionResponse__Output } from '../starlark_debugging/ContinueExecutionResponse';
import type { EvaluateResponse as _starlark_debugging_EvaluateResponse, EvaluateResponse__Output as _starlark_debugging_EvaluateResponse__Output } from '../starlark_debugging/EvaluateResponse';
import type { ListFramesResponse as _starlark_debugging_ListFramesResponse, ListFramesResponse__Output as _starlark_debugging_ListFramesResponse__Output } from '../starlark_debugging/ListFramesResponse';
import type { StartDebuggingResponse as _starlark_debugging_StartDebuggingResponse, StartDebuggingResponse__Output as _starlark_debugging_StartDebuggingResponse__Output } from '../starlark_debugging/StartDebuggingResponse';
import type { PauseThreadResponse as _starlark_debugging_PauseThreadResponse, PauseThreadResponse__Output as _starlark_debugging_PauseThreadResponse__Output } from '../starlark_debugging/PauseThreadResponse';
import type { GetChildrenResponse as _starlark_debugging_GetChildrenResponse, GetChildrenResponse__Output as _starlark_debugging_GetChildrenResponse__Output } from '../starlark_debugging/GetChildrenResponse';
import type { ThreadPausedEvent as _starlark_debugging_ThreadPausedEvent, ThreadPausedEvent__Output as _starlark_debugging_ThreadPausedEvent__Output } from '../starlark_debugging/ThreadPausedEvent';
import type { ThreadContinuedEvent as _starlark_debugging_ThreadContinuedEvent, ThreadContinuedEvent__Output as _starlark_debugging_ThreadContinuedEvent__Output } from '../starlark_debugging/ThreadContinuedEvent';
import type { Long } from '@grpc/proto-loader';

/**
 * There are two kinds of events: "responses", which correspond to a
 * DebugRequest sent by the client, and other asynchronous events that may be
 * sent by the server to notify the client of activity in the Starlark code
 * being debugged.
 */
export interface DebugEvent {
  /**
   * If non-zero, this event is a response to a DebugRequest with the same
   * sequence number.
   */
  'sequenceNumber'?: (number | string | Long);
  'error'?: (_starlark_debugging_Error);
  'setBreakpoints'?: (_starlark_debugging_SetBreakpointsResponse);
  'continueExecution'?: (_starlark_debugging_ContinueExecutionResponse);
  'evaluate'?: (_starlark_debugging_EvaluateResponse);
  'listFrames'?: (_starlark_debugging_ListFramesResponse);
  'startDebugging'?: (_starlark_debugging_StartDebuggingResponse);
  'pauseThread'?: (_starlark_debugging_PauseThreadResponse);
  'getChildren'?: (_starlark_debugging_GetChildrenResponse);
  'threadPaused'?: (_starlark_debugging_ThreadPausedEvent);
  'threadContinued'?: (_starlark_debugging_ThreadContinuedEvent);
  /**
   * The payload describes the type of event and any additional information
   * about the event.
   */
  'payload'?: "error"|"setBreakpoints"|"continueExecution"|"evaluate"|"listFrames"|"startDebugging"|"pauseThread"|"getChildren"|"threadPaused"|"threadContinued";
}

/**
 * There are two kinds of events: "responses", which correspond to a
 * DebugRequest sent by the client, and other asynchronous events that may be
 * sent by the server to notify the client of activity in the Starlark code
 * being debugged.
 */
export interface DebugEvent__Output {
  /**
   * If non-zero, this event is a response to a DebugRequest with the same
   * sequence number.
   */
  'sequenceNumber': (Long);
  'error'?: (_starlark_debugging_Error__Output);
  'setBreakpoints'?: (_starlark_debugging_SetBreakpointsResponse__Output);
  'continueExecution'?: (_starlark_debugging_ContinueExecutionResponse__Output);
  'evaluate'?: (_starlark_debugging_EvaluateResponse__Output);
  'listFrames'?: (_starlark_debugging_ListFramesResponse__Output);
  'startDebugging'?: (_starlark_debugging_StartDebuggingResponse__Output);
  'pauseThread'?: (_starlark_debugging_PauseThreadResponse__Output);
  'getChildren'?: (_starlark_debugging_GetChildrenResponse__Output);
  'threadPaused'?: (_starlark_debugging_ThreadPausedEvent__Output);
  'threadContinued'?: (_starlark_debugging_ThreadContinuedEvent__Output);
  /**
   * The payload describes the type of event and any additional information
   * about the event.
   */
  'payload': "error"|"setBreakpoints"|"continueExecution"|"evaluate"|"listFrames"|"startDebugging"|"pauseThread"|"getChildren"|"threadPaused"|"threadContinued";
}
