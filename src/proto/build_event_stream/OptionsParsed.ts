// Original file: proto/build_event_stream.proto

import type {
  InvocationPolicy as _blaze_invocation_policy_InvocationPolicy,
  InvocationPolicy__Output as _blaze_invocation_policy_InvocationPolicy__Output,
} from '../blaze/invocation_policy/InvocationPolicy';

/**
 * Payload of an event reporting on the parsed options, grouped in various ways.
 */
export interface OptionsParsed {
  startupOptions?: string[];
  explicitStartupOptions?: string[];
  cmdLine?: string[];
  explicitCmdLine?: string[];
  invocationPolicy?: _blaze_invocation_policy_InvocationPolicy;
  toolTag?: string;
}

/**
 * Payload of an event reporting on the parsed options, grouped in various ways.
 */
export interface OptionsParsed__Output {
  startupOptions: string[];
  explicitStartupOptions: string[];
  cmdLine: string[];
  explicitCmdLine: string[];
  invocationPolicy?: _blaze_invocation_policy_InvocationPolicy__Output;
  toolTag: string;
}
