// Original file: proto/build_event_stream.proto

import { BuildEventId as _build_event_stream_BuildEventId, BuildEventId__Output as _build_event_stream_BuildEventId__Output } from '../build_event_stream/BuildEventId';
import { Progress as _build_event_stream_Progress, Progress__Output as _build_event_stream_Progress__Output } from '../build_event_stream/Progress';
import { Aborted as _build_event_stream_Aborted, Aborted__Output as _build_event_stream_Aborted__Output } from '../build_event_stream/Aborted';
import { BuildStarted as _build_event_stream_BuildStarted, BuildStarted__Output as _build_event_stream_BuildStarted__Output } from '../build_event_stream/BuildStarted';
import { PatternExpanded as _build_event_stream_PatternExpanded, PatternExpanded__Output as _build_event_stream_PatternExpanded__Output } from '../build_event_stream/PatternExpanded';
import { ActionExecuted as _build_event_stream_ActionExecuted, ActionExecuted__Output as _build_event_stream_ActionExecuted__Output } from '../build_event_stream/ActionExecuted';
import { TargetComplete as _build_event_stream_TargetComplete, TargetComplete__Output as _build_event_stream_TargetComplete__Output } from '../build_event_stream/TargetComplete';
import { TestSummary as _build_event_stream_TestSummary, TestSummary__Output as _build_event_stream_TestSummary__Output } from '../build_event_stream/TestSummary';
import { TestResult as _build_event_stream_TestResult, TestResult__Output as _build_event_stream_TestResult__Output } from '../build_event_stream/TestResult';
import { UnstructuredCommandLine as _build_event_stream_UnstructuredCommandLine, UnstructuredCommandLine__Output as _build_event_stream_UnstructuredCommandLine__Output } from '../build_event_stream/UnstructuredCommandLine';
import { OptionsParsed as _build_event_stream_OptionsParsed, OptionsParsed__Output as _build_event_stream_OptionsParsed__Output } from '../build_event_stream/OptionsParsed';
import { BuildFinished as _build_event_stream_BuildFinished, BuildFinished__Output as _build_event_stream_BuildFinished__Output } from '../build_event_stream/BuildFinished';
import { NamedSetOfFiles as _build_event_stream_NamedSetOfFiles, NamedSetOfFiles__Output as _build_event_stream_NamedSetOfFiles__Output } from '../build_event_stream/NamedSetOfFiles';
import { WorkspaceStatus as _build_event_stream_WorkspaceStatus, WorkspaceStatus__Output as _build_event_stream_WorkspaceStatus__Output } from '../build_event_stream/WorkspaceStatus';
import { Configuration as _build_event_stream_Configuration, Configuration__Output as _build_event_stream_Configuration__Output } from '../build_event_stream/Configuration';
import { TargetConfigured as _build_event_stream_TargetConfigured, TargetConfigured__Output as _build_event_stream_TargetConfigured__Output } from '../build_event_stream/TargetConfigured';
import { Fetch as _build_event_stream_Fetch, Fetch__Output as _build_event_stream_Fetch__Output } from '../build_event_stream/Fetch';
import { CommandLine as _command_line_CommandLine, CommandLine__Output as _command_line_CommandLine__Output } from '../command_line/CommandLine';
import { BuildToolLogs as _build_event_stream_BuildToolLogs, BuildToolLogs__Output as _build_event_stream_BuildToolLogs__Output } from '../build_event_stream/BuildToolLogs';
import { BuildMetrics as _build_event_stream_BuildMetrics, BuildMetrics__Output as _build_event_stream_BuildMetrics__Output } from '../build_event_stream/BuildMetrics';
import { WorkspaceConfig as _build_event_stream_WorkspaceConfig, WorkspaceConfig__Output as _build_event_stream_WorkspaceConfig__Output } from '../build_event_stream/WorkspaceConfig';
import { BuildMetadata as _build_event_stream_BuildMetadata, BuildMetadata__Output as _build_event_stream_BuildMetadata__Output } from '../build_event_stream/BuildMetadata';
import { ConvenienceSymlinksIdentified as _build_event_stream_ConvenienceSymlinksIdentified, ConvenienceSymlinksIdentified__Output as _build_event_stream_ConvenienceSymlinksIdentified__Output } from '../build_event_stream/ConvenienceSymlinksIdentified';

/**
 * Message describing a build event. Events will have an identifier that
 * is unique within a given build invocation; they also announce follow-up
 * events as children. More details, which are specific to the kind of event
 * that is observed, is provided in the payload. More options for the payload
 * might be added in the future.
 */
export interface BuildEvent {
  'id'?: (_build_event_stream_BuildEventId);
  'children'?: (_build_event_stream_BuildEventId)[];
  'progress'?: (_build_event_stream_Progress);
  'aborted'?: (_build_event_stream_Aborted);
  'started'?: (_build_event_stream_BuildStarted);
  'expanded'?: (_build_event_stream_PatternExpanded);
  'action'?: (_build_event_stream_ActionExecuted);
  'completed'?: (_build_event_stream_TargetComplete);
  'testSummary'?: (_build_event_stream_TestSummary);
  'testResult'?: (_build_event_stream_TestResult);
  'unstructuredCommandLine'?: (_build_event_stream_UnstructuredCommandLine);
  'optionsParsed'?: (_build_event_stream_OptionsParsed);
  'finished'?: (_build_event_stream_BuildFinished);
  'namedSetOfFiles'?: (_build_event_stream_NamedSetOfFiles);
  'workspaceStatus'?: (_build_event_stream_WorkspaceStatus);
  'configuration'?: (_build_event_stream_Configuration);
  'configured'?: (_build_event_stream_TargetConfigured);
  'lastMessage'?: (boolean);
  'fetch'?: (_build_event_stream_Fetch);
  'structuredCommandLine'?: (_command_line_CommandLine);
  'buildToolLogs'?: (_build_event_stream_BuildToolLogs);
  'buildMetrics'?: (_build_event_stream_BuildMetrics);
  'workspaceInfo'?: (_build_event_stream_WorkspaceConfig);
  'buildMetadata'?: (_build_event_stream_BuildMetadata);
  'convenienceSymlinksIdentified'?: (_build_event_stream_ConvenienceSymlinksIdentified);
  'payload'?: "progress"|"aborted"|"started"|"unstructuredCommandLine"|"structuredCommandLine"|"optionsParsed"|"workspaceStatus"|"fetch"|"configuration"|"expanded"|"configured"|"action"|"namedSetOfFiles"|"completed"|"testResult"|"testSummary"|"finished"|"buildToolLogs"|"buildMetrics"|"workspaceInfo"|"buildMetadata"|"convenienceSymlinksIdentified";
}

/**
 * Message describing a build event. Events will have an identifier that
 * is unique within a given build invocation; they also announce follow-up
 * events as children. More details, which are specific to the kind of event
 * that is observed, is provided in the payload. More options for the payload
 * might be added in the future.
 */
export interface BuildEvent__Output {
  'id'?: (_build_event_stream_BuildEventId__Output);
  'children': (_build_event_stream_BuildEventId__Output)[];
  'progress'?: (_build_event_stream_Progress__Output);
  'aborted'?: (_build_event_stream_Aborted__Output);
  'started'?: (_build_event_stream_BuildStarted__Output);
  'expanded'?: (_build_event_stream_PatternExpanded__Output);
  'action'?: (_build_event_stream_ActionExecuted__Output);
  'completed'?: (_build_event_stream_TargetComplete__Output);
  'testSummary'?: (_build_event_stream_TestSummary__Output);
  'testResult'?: (_build_event_stream_TestResult__Output);
  'unstructuredCommandLine'?: (_build_event_stream_UnstructuredCommandLine__Output);
  'optionsParsed'?: (_build_event_stream_OptionsParsed__Output);
  'finished'?: (_build_event_stream_BuildFinished__Output);
  'namedSetOfFiles'?: (_build_event_stream_NamedSetOfFiles__Output);
  'workspaceStatus'?: (_build_event_stream_WorkspaceStatus__Output);
  'configuration'?: (_build_event_stream_Configuration__Output);
  'configured'?: (_build_event_stream_TargetConfigured__Output);
  'lastMessage': (boolean);
  'fetch'?: (_build_event_stream_Fetch__Output);
  'structuredCommandLine'?: (_command_line_CommandLine__Output);
  'buildToolLogs'?: (_build_event_stream_BuildToolLogs__Output);
  'buildMetrics'?: (_build_event_stream_BuildMetrics__Output);
  'workspaceInfo'?: (_build_event_stream_WorkspaceConfig__Output);
  'buildMetadata'?: (_build_event_stream_BuildMetadata__Output);
  'convenienceSymlinksIdentified'?: (_build_event_stream_ConvenienceSymlinksIdentified__Output);
  'payload': "progress"|"aborted"|"started"|"unstructuredCommandLine"|"structuredCommandLine"|"optionsParsed"|"workspaceStatus"|"fetch"|"configuration"|"expanded"|"configured"|"action"|"namedSetOfFiles"|"completed"|"testResult"|"testSummary"|"finished"|"buildToolLogs"|"buildMetrics"|"workspaceInfo"|"buildMetadata"|"convenienceSymlinksIdentified";
}
