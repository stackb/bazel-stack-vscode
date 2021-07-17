// Original file: proto/build_event_stream.proto

import type {
  BuildEventId as _build_event_stream_BuildEventId,
  BuildEventId__Output as _build_event_stream_BuildEventId__Output,
} from '../build_event_stream/BuildEventId';
import type {
  Progress as _build_event_stream_Progress,
  Progress__Output as _build_event_stream_Progress__Output,
} from '../build_event_stream/Progress';
import type {
  Aborted as _build_event_stream_Aborted,
  Aborted__Output as _build_event_stream_Aborted__Output,
} from '../build_event_stream/Aborted';
import type {
  BuildStarted as _build_event_stream_BuildStarted,
  BuildStarted__Output as _build_event_stream_BuildStarted__Output,
} from '../build_event_stream/BuildStarted';
import type {
  PatternExpanded as _build_event_stream_PatternExpanded,
  PatternExpanded__Output as _build_event_stream_PatternExpanded__Output,
} from '../build_event_stream/PatternExpanded';
import type {
  ActionExecuted as _build_event_stream_ActionExecuted,
  ActionExecuted__Output as _build_event_stream_ActionExecuted__Output,
} from '../build_event_stream/ActionExecuted';
import type {
  TargetComplete as _build_event_stream_TargetComplete,
  TargetComplete__Output as _build_event_stream_TargetComplete__Output,
} from '../build_event_stream/TargetComplete';
import type {
  TestSummary as _build_event_stream_TestSummary,
  TestSummary__Output as _build_event_stream_TestSummary__Output,
} from '../build_event_stream/TestSummary';
import type {
  TestResult as _build_event_stream_TestResult,
  TestResult__Output as _build_event_stream_TestResult__Output,
} from '../build_event_stream/TestResult';
import type {
  UnstructuredCommandLine as _build_event_stream_UnstructuredCommandLine,
  UnstructuredCommandLine__Output as _build_event_stream_UnstructuredCommandLine__Output,
} from '../build_event_stream/UnstructuredCommandLine';
import type {
  OptionsParsed as _build_event_stream_OptionsParsed,
  OptionsParsed__Output as _build_event_stream_OptionsParsed__Output,
} from '../build_event_stream/OptionsParsed';
import type {
  BuildFinished as _build_event_stream_BuildFinished,
  BuildFinished__Output as _build_event_stream_BuildFinished__Output,
} from '../build_event_stream/BuildFinished';
import type {
  NamedSetOfFiles as _build_event_stream_NamedSetOfFiles,
  NamedSetOfFiles__Output as _build_event_stream_NamedSetOfFiles__Output,
} from '../build_event_stream/NamedSetOfFiles';
import type {
  WorkspaceStatus as _build_event_stream_WorkspaceStatus,
  WorkspaceStatus__Output as _build_event_stream_WorkspaceStatus__Output,
} from '../build_event_stream/WorkspaceStatus';
import type {
  Configuration as _build_event_stream_Configuration,
  Configuration__Output as _build_event_stream_Configuration__Output,
} from '../build_event_stream/Configuration';
import type {
  TargetConfigured as _build_event_stream_TargetConfigured,
  TargetConfigured__Output as _build_event_stream_TargetConfigured__Output,
} from '../build_event_stream/TargetConfigured';
import type {
  Fetch as _build_event_stream_Fetch,
  Fetch__Output as _build_event_stream_Fetch__Output,
} from '../build_event_stream/Fetch';
import type {
  CommandLine as _command_line_CommandLine,
  CommandLine__Output as _command_line_CommandLine__Output,
} from '../command_line/CommandLine';
import type {
  BuildToolLogs as _build_event_stream_BuildToolLogs,
  BuildToolLogs__Output as _build_event_stream_BuildToolLogs__Output,
} from '../build_event_stream/BuildToolLogs';
import type {
  BuildMetrics as _build_event_stream_BuildMetrics,
  BuildMetrics__Output as _build_event_stream_BuildMetrics__Output,
} from '../build_event_stream/BuildMetrics';
import type {
  WorkspaceConfig as _build_event_stream_WorkspaceConfig,
  WorkspaceConfig__Output as _build_event_stream_WorkspaceConfig__Output,
} from '../build_event_stream/WorkspaceConfig';
import type {
  BuildMetadata as _build_event_stream_BuildMetadata,
  BuildMetadata__Output as _build_event_stream_BuildMetadata__Output,
} from '../build_event_stream/BuildMetadata';
import type {
  ConvenienceSymlinksIdentified as _build_event_stream_ConvenienceSymlinksIdentified,
  ConvenienceSymlinksIdentified__Output as _build_event_stream_ConvenienceSymlinksIdentified__Output,
} from '../build_event_stream/ConvenienceSymlinksIdentified';

/**
 * Message describing a build event. Events will have an identifier that
 * is unique within a given build invocation; they also announce follow-up
 * events as children. More details, which are specific to the kind of event
 * that is observed, is provided in the payload. More options for the payload
 * might be added in the future.
 */
export interface BuildEvent {
  id?: _build_event_stream_BuildEventId | null;
  children?: _build_event_stream_BuildEventId[];
  progress?: _build_event_stream_Progress | null;
  aborted?: _build_event_stream_Aborted | null;
  started?: _build_event_stream_BuildStarted | null;
  expanded?: _build_event_stream_PatternExpanded | null;
  action?: _build_event_stream_ActionExecuted | null;
  completed?: _build_event_stream_TargetComplete | null;
  testSummary?: _build_event_stream_TestSummary | null;
  testResult?: _build_event_stream_TestResult | null;
  unstructuredCommandLine?: _build_event_stream_UnstructuredCommandLine | null;
  optionsParsed?: _build_event_stream_OptionsParsed | null;
  finished?: _build_event_stream_BuildFinished | null;
  namedSetOfFiles?: _build_event_stream_NamedSetOfFiles | null;
  workspaceStatus?: _build_event_stream_WorkspaceStatus | null;
  configuration?: _build_event_stream_Configuration | null;
  configured?: _build_event_stream_TargetConfigured | null;
  lastMessage?: boolean;
  fetch?: _build_event_stream_Fetch | null;
  structuredCommandLine?: _command_line_CommandLine | null;
  buildToolLogs?: _build_event_stream_BuildToolLogs | null;
  buildMetrics?: _build_event_stream_BuildMetrics | null;
  workspaceInfo?: _build_event_stream_WorkspaceConfig | null;
  buildMetadata?: _build_event_stream_BuildMetadata | null;
  convenienceSymlinksIdentified?: _build_event_stream_ConvenienceSymlinksIdentified | null;
  payload?:
    | 'progress'
    | 'aborted'
    | 'started'
    | 'unstructuredCommandLine'
    | 'structuredCommandLine'
    | 'optionsParsed'
    | 'workspaceStatus'
    | 'fetch'
    | 'configuration'
    | 'expanded'
    | 'configured'
    | 'action'
    | 'namedSetOfFiles'
    | 'completed'
    | 'testResult'
    | 'testSummary'
    | 'finished'
    | 'buildToolLogs'
    | 'buildMetrics'
    | 'workspaceInfo'
    | 'buildMetadata'
    | 'convenienceSymlinksIdentified';
}

/**
 * Message describing a build event. Events will have an identifier that
 * is unique within a given build invocation; they also announce follow-up
 * events as children. More details, which are specific to the kind of event
 * that is observed, is provided in the payload. More options for the payload
 * might be added in the future.
 */
export interface BuildEvent__Output {
  id: _build_event_stream_BuildEventId__Output | null;
  children: _build_event_stream_BuildEventId__Output[];
  progress?: _build_event_stream_Progress__Output | null;
  aborted?: _build_event_stream_Aborted__Output | null;
  started?: _build_event_stream_BuildStarted__Output | null;
  expanded?: _build_event_stream_PatternExpanded__Output | null;
  action?: _build_event_stream_ActionExecuted__Output | null;
  completed?: _build_event_stream_TargetComplete__Output | null;
  testSummary?: _build_event_stream_TestSummary__Output | null;
  testResult?: _build_event_stream_TestResult__Output | null;
  unstructuredCommandLine?: _build_event_stream_UnstructuredCommandLine__Output | null;
  optionsParsed?: _build_event_stream_OptionsParsed__Output | null;
  finished?: _build_event_stream_BuildFinished__Output | null;
  namedSetOfFiles?: _build_event_stream_NamedSetOfFiles__Output | null;
  workspaceStatus?: _build_event_stream_WorkspaceStatus__Output | null;
  configuration?: _build_event_stream_Configuration__Output | null;
  configured?: _build_event_stream_TargetConfigured__Output | null;
  lastMessage: boolean;
  fetch?: _build_event_stream_Fetch__Output | null;
  structuredCommandLine?: _command_line_CommandLine__Output | null;
  buildToolLogs?: _build_event_stream_BuildToolLogs__Output | null;
  buildMetrics?: _build_event_stream_BuildMetrics__Output | null;
  workspaceInfo?: _build_event_stream_WorkspaceConfig__Output | null;
  buildMetadata?: _build_event_stream_BuildMetadata__Output | null;
  convenienceSymlinksIdentified?: _build_event_stream_ConvenienceSymlinksIdentified__Output | null;
  payload:
    | 'progress'
    | 'aborted'
    | 'started'
    | 'unstructuredCommandLine'
    | 'structuredCommandLine'
    | 'optionsParsed'
    | 'workspaceStatus'
    | 'fetch'
    | 'configuration'
    | 'expanded'
    | 'configured'
    | 'action'
    | 'namedSetOfFiles'
    | 'completed'
    | 'testResult'
    | 'testSummary'
    | 'finished'
    | 'buildToolLogs'
    | 'buildMetrics'
    | 'workspaceInfo'
    | 'buildMetadata'
    | 'convenienceSymlinksIdentified';
}
