// Original file: proto/build_event_stream.proto

/**
 * Identifier of an event reporting that an action was completed (not all
 * actions are reported, only the ones that can be considered important;
 * this includes all failed actions).
 */
export interface _build_event_stream_BuildEventId_ActionCompletedId {
  primaryOutput?: string;
  /**
   * Optional, the label of the owner of the action, for reference.
   */
  label?: string;
  /**
   * Optional, the id of the configuration of the action owner.
   */
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
}

/**
 * Identifier of an event reporting that an action was completed (not all
 * actions are reported, only the ones that can be considered important;
 * this includes all failed actions).
 */
export interface _build_event_stream_BuildEventId_ActionCompletedId__Output {
  primaryOutput: string;
  /**
   * Optional, the label of the owner of the action, for reference.
   */
  label: string;
  /**
   * Optional, the id of the configuration of the action owner.
   */
  configuration: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
}

/**
 * Identifier of the BuildFinished event, indicating the end of a build.
 */
export interface _build_event_stream_BuildEventId_BuildFinishedId {}

/**
 * Identifier of the BuildFinished event, indicating the end of a build.
 */
export interface _build_event_stream_BuildEventId_BuildFinishedId__Output {}

export interface _build_event_stream_BuildEventId_BuildMetadataId {}

export interface _build_event_stream_BuildEventId_BuildMetadataId__Output {}

/**
 * Identifier of an event providing build metrics after completion
 * of the build.
 */
export interface _build_event_stream_BuildEventId_BuildMetricsId {}

/**
 * Identifier of an event providing build metrics after completion
 * of the build.
 */
export interface _build_event_stream_BuildEventId_BuildMetricsId__Output {}

/**
 * Identifier of an event indicating the beginning of a build; this will
 * normally be the first event.
 */
export interface _build_event_stream_BuildEventId_BuildStartedId {}

/**
 * Identifier of an event indicating the beginning of a build; this will
 * normally be the first event.
 */
export interface _build_event_stream_BuildEventId_BuildStartedId__Output {}

/**
 * Identifier of an event providing additional logs/statistics after
 * completion of the build.
 */
export interface _build_event_stream_BuildEventId_BuildToolLogsId {}

/**
 * Identifier of an event providing additional logs/statistics after
 * completion of the build.
 */
export interface _build_event_stream_BuildEventId_BuildToolLogsId__Output {}

/**
 * Identifier of an event introducing a configuration.
 */
export interface _build_event_stream_BuildEventId_ConfigurationId {
  /**
   * Identifier of the configuration; users of the protocol should not make
   * any assumptions about it having any structure, or equality of the
   * identifier between different streams.
   */
  id?: string;
}

/**
 * Identifier of an event introducing a configuration.
 */
export interface _build_event_stream_BuildEventId_ConfigurationId__Output {
  /**
   * Identifier of the configuration; users of the protocol should not make
   * any assumptions about it having any structure, or equality of the
   * identifier between different streams.
   */
  id: string;
}

/**
 * Identifier of an event reporting an event associated with a configured
 * label, usually a visibility error. In any case, an event with such an
 * id will always report some form of error (i.e., the payload will be an
 * Aborted event); there are no regular events using this identifier.
 */
export interface _build_event_stream_BuildEventId_ConfiguredLabelId {
  label?: string;
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
}

/**
 * Identifier of an event reporting an event associated with a configured
 * label, usually a visibility error. In any case, an event with such an
 * id will always report some form of error (i.e., the payload will be an
 * Aborted event); there are no regular events using this identifier.
 */
export interface _build_event_stream_BuildEventId_ConfiguredLabelId__Output {
  label: string;
  configuration: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
}

/**
 * Identifier of an event providing convenience symlinks information.
 */
export interface _build_event_stream_BuildEventId_ConvenienceSymlinksIdentifiedId {}

/**
 * Identifier of an event providing convenience symlinks information.
 */
export interface _build_event_stream_BuildEventId_ConvenienceSymlinksIdentifiedId__Output {}

/**
 * Identifier of an event reporting that an external resource was fetched
 * from.
 */
export interface _build_event_stream_BuildEventId_FetchId {
  /**
   * The external resource that was fetched from.
   */
  url?: string;
}

/**
 * Identifier of an event reporting that an external resource was fetched
 * from.
 */
export interface _build_event_stream_BuildEventId_FetchId__Output {
  /**
   * The external resource that was fetched from.
   */
  url: string;
}

/**
 * Identifier of an event introducing a named set of files (usually artifacts)
 * to be referred to in later messages.
 */
export interface _build_event_stream_BuildEventId_NamedSetOfFilesId {
  /**
   * Identifier of the file set; this is an opaque string valid only for the
   * particular instance of the event stream.
   */
  id?: string;
}

/**
 * Identifier of an event introducing a named set of files (usually artifacts)
 * to be referred to in later messages.
 */
export interface _build_event_stream_BuildEventId_NamedSetOfFilesId__Output {
  /**
   * Identifier of the file set; this is an opaque string valid only for the
   * particular instance of the event stream.
   */
  id: string;
}

/**
 * Identifier on an event reporting on the options included in the command
 * line, both explicitly and implicitly.
 */
export interface _build_event_stream_BuildEventId_OptionsParsedId {}

/**
 * Identifier on an event reporting on the options included in the command
 * line, both explicitly and implicitly.
 */
export interface _build_event_stream_BuildEventId_OptionsParsedId__Output {}

/**
 * Identifier of an event indicating that a target pattern has been expanded
 * further.
 * Messages of this shape are also used to describe parts of a pattern that
 * have been skipped for some reason, if the actual expansion was still
 * carried out (e.g., if keep_going is set). In this case, the
 * pattern_skipped choice in the id field is to be made.
 */
export interface _build_event_stream_BuildEventId_PatternExpandedId {
  /**
   * Identifier of an event indicating that a target pattern has been expanded
   * further.
   * Messages of this shape are also used to describe parts of a pattern that
   * have been skipped for some reason, if the actual expansion was still
   * carried out (e.g., if keep_going is set). In this case, the
   * pattern_skipped choice in the id field is to be made.
   */
  pattern?: string[];
}

/**
 * Identifier of an event indicating that a target pattern has been expanded
 * further.
 * Messages of this shape are also used to describe parts of a pattern that
 * have been skipped for some reason, if the actual expansion was still
 * carried out (e.g., if keep_going is set). In this case, the
 * pattern_skipped choice in the id field is to be made.
 */
export interface _build_event_stream_BuildEventId_PatternExpandedId__Output {
  /**
   * Identifier of an event indicating that a target pattern has been expanded
   * further.
   * Messages of this shape are also used to describe parts of a pattern that
   * have been skipped for some reason, if the actual expansion was still
   * carried out (e.g., if keep_going is set). In this case, the
   * pattern_skipped choice in the id field is to be made.
   */
  pattern: string[];
}

/**
 * Identifier of an event reporting progress. Those events are also used to
 * chain in events that come early.
 */
export interface _build_event_stream_BuildEventId_ProgressId {
  /**
   * Unique identifier. No assumption should be made about how the ids are
   * assigned; the only meaningful operation on this field is test for
   * equality.
   */
  opaqueCount?: number;
}

/**
 * Identifier of an event reporting progress. Those events are also used to
 * chain in events that come early.
 */
export interface _build_event_stream_BuildEventId_ProgressId__Output {
  /**
   * Unique identifier. No assumption should be made about how the ids are
   * assigned; the only meaningful operation on this field is test for
   * equality.
   */
  opaqueCount: number;
}

/**
 * Identifier on an event describing the commandline received by Bazel.
 */
export interface _build_event_stream_BuildEventId_StructuredCommandLineId {
  /**
   * A title for this command line value, as there may be multiple.
   * For example, a single invocation may wish to report both the literal and
   * canonical command lines, and this label would be used to differentiate
   * between both versions.
   */
  commandLineLabel?: string;
}

/**
 * Identifier on an event describing the commandline received by Bazel.
 */
export interface _build_event_stream_BuildEventId_StructuredCommandLineId__Output {
  /**
   * A title for this command line value, as there may be multiple.
   * For example, a single invocation may wish to report both the literal and
   * canonical command lines, and this label would be used to differentiate
   * between both versions.
   */
  commandLineLabel: string;
}

/**
 * Identifier of an event indicating that a target was built completely; this
 * does not include running the test if the target is a test target.
 */
export interface _build_event_stream_BuildEventId_TargetCompletedId {
  label?: string;
  /**
   * The configuration for which the target was built.
   */
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
  /**
   * If not empty, the id refers to the completion of the target for a given
   * aspect.
   */
  aspect?: string;
}

/**
 * Identifier of an event indicating that a target was built completely; this
 * does not include running the test if the target is a test target.
 */
export interface _build_event_stream_BuildEventId_TargetCompletedId__Output {
  label: string;
  /**
   * The configuration for which the target was built.
   */
  configuration: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
  /**
   * If not empty, the id refers to the completion of the target for a given
   * aspect.
   */
  aspect: string;
}

/**
 * Identifier of an event indicating that a target has been expanded by
 * identifying for which configurations it should be build.
 */
export interface _build_event_stream_BuildEventId_TargetConfiguredId {
  label?: string;
  /**
   * If not empty, the id refers to the expansion of the target for a given
   * aspect.
   */
  aspect?: string;
}

/**
 * Identifier of an event indicating that a target has been expanded by
 * identifying for which configurations it should be build.
 */
export interface _build_event_stream_BuildEventId_TargetConfiguredId__Output {
  label: string;
  /**
   * If not empty, the id refers to the expansion of the target for a given
   * aspect.
   */
  aspect: string;
}

/**
 * Identifier of an event reporting on an individual test run. The label
 * identifies the test that is reported about, the remaining fields are
 * in such a way as to uniquely identify the action within a build. In fact,
 * attempts for the same test, run, shard triple are counted sequentially,
 * starting with 1.
 */
export interface _build_event_stream_BuildEventId_TestResultId {
  label?: string;
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
  run?: number;
  shard?: number;
  attempt?: number;
}

/**
 * Identifier of an event reporting on an individual test run. The label
 * identifies the test that is reported about, the remaining fields are
 * in such a way as to uniquely identify the action within a build. In fact,
 * attempts for the same test, run, shard triple are counted sequentially,
 * starting with 1.
 */
export interface _build_event_stream_BuildEventId_TestResultId__Output {
  label: string;
  configuration: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
  run: number;
  shard: number;
  attempt: number;
}

/**
 * Identifier of an event reporting the summary of a test.
 */
export interface _build_event_stream_BuildEventId_TestSummaryId {
  label?: string;
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
}

/**
 * Identifier of an event reporting the summary of a test.
 */
export interface _build_event_stream_BuildEventId_TestSummaryId__Output {
  label: string;
  configuration: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
}

/**
 * Identifier of an event reporting an event associated with an unconfigured
 * label. Usually, this indicates a failure due to a missing input file. In
 * any case, it will report some form of error (i.e., the payload will be an
 * Aborted event); there are no regular events using this identifier. The
 * purpose of those events is to serve as the root cause of a failed target.
 */
export interface _build_event_stream_BuildEventId_UnconfiguredLabelId {
  /**
   * Identifier of an event reporting an event associated with an unconfigured
   * label. Usually, this indicates a failure due to a missing input file. In
   * any case, it will report some form of error (i.e., the payload will be an
   * Aborted event); there are no regular events using this identifier. The
   * purpose of those events is to serve as the root cause of a failed target.
   */
  label?: string;
}

/**
 * Identifier of an event reporting an event associated with an unconfigured
 * label. Usually, this indicates a failure due to a missing input file. In
 * any case, it will report some form of error (i.e., the payload will be an
 * Aborted event); there are no regular events using this identifier. The
 * purpose of those events is to serve as the root cause of a failed target.
 */
export interface _build_event_stream_BuildEventId_UnconfiguredLabelId__Output {
  /**
   * Identifier of an event reporting an event associated with an unconfigured
   * label. Usually, this indicates a failure due to a missing input file. In
   * any case, it will report some form of error (i.e., the payload will be an
   * Aborted event); there are no regular events using this identifier. The
   * purpose of those events is to serve as the root cause of a failed target.
   */
  label: string;
}

/**
 * Generic identifier for a build event. This is the default type of
 * BuildEventId, but should not be used outside testing; nevertheless,
 * tools should handle build events with this kind of id gracefully.
 */
export interface _build_event_stream_BuildEventId_UnknownBuildEventId {
  /**
   * Generic identifier for a build event. This is the default type of
   * BuildEventId, but should not be used outside testing; nevertheless,
   * tools should handle build events with this kind of id gracefully.
   */
  details?: string;
}

/**
 * Generic identifier for a build event. This is the default type of
 * BuildEventId, but should not be used outside testing; nevertheless,
 * tools should handle build events with this kind of id gracefully.
 */
export interface _build_event_stream_BuildEventId_UnknownBuildEventId__Output {
  /**
   * Generic identifier for a build event. This is the default type of
   * BuildEventId, but should not be used outside testing; nevertheless,
   * tools should handle build events with this kind of id gracefully.
   */
  details: string;
}

/**
 * Identifier on an event indicating the original commandline received by
 * the bazel server.
 */
export interface _build_event_stream_BuildEventId_UnstructuredCommandLineId {}

/**
 * Identifier on an event indicating the original commandline received by
 * the bazel server.
 */
export interface _build_event_stream_BuildEventId_UnstructuredCommandLineId__Output {}

export interface _build_event_stream_BuildEventId_WorkspaceConfigId {}

export interface _build_event_stream_BuildEventId_WorkspaceConfigId__Output {}

/**
 * Identifier of an event indicating the workspace status.
 */
export interface _build_event_stream_BuildEventId_WorkspaceStatusId {}

/**
 * Identifier of an event indicating the workspace status.
 */
export interface _build_event_stream_BuildEventId_WorkspaceStatusId__Output {}

/**
 * Identifier for a build event. It is deliberately structured to also provide
 * information about which build target etc the event is related to.
 *
 * Events are chained via the event id as follows: each event has an id and a
 * set of ids of children events such that apart from the initial event each
 * event has an id that is mentioned as child id in an earlier event and a build
 * invocation is complete if and only if all direct and indirect children of the
 * initial event have been posted.
 */
export interface BuildEventId {
  unknown?: _build_event_stream_BuildEventId_UnknownBuildEventId | null;
  progress?: _build_event_stream_BuildEventId_ProgressId | null;
  started?: _build_event_stream_BuildEventId_BuildStartedId | null;
  pattern?: _build_event_stream_BuildEventId_PatternExpandedId | null;
  targetCompleted?: _build_event_stream_BuildEventId_TargetCompletedId | null;
  actionCompleted?: _build_event_stream_BuildEventId_ActionCompletedId | null;
  testSummary?: _build_event_stream_BuildEventId_TestSummaryId | null;
  testResult?: _build_event_stream_BuildEventId_TestResultId | null;
  buildFinished?: _build_event_stream_BuildEventId_BuildFinishedId | null;
  patternSkipped?: _build_event_stream_BuildEventId_PatternExpandedId | null;
  unstructuredCommandLine?: _build_event_stream_BuildEventId_UnstructuredCommandLineId | null;
  optionsParsed?: _build_event_stream_BuildEventId_OptionsParsedId | null;
  namedSet?: _build_event_stream_BuildEventId_NamedSetOfFilesId | null;
  workspaceStatus?: _build_event_stream_BuildEventId_WorkspaceStatusId | null;
  configuration?: _build_event_stream_BuildEventId_ConfigurationId | null;
  targetConfigured?: _build_event_stream_BuildEventId_TargetConfiguredId | null;
  fetch?: _build_event_stream_BuildEventId_FetchId | null;
  structuredCommandLine?: _build_event_stream_BuildEventId_StructuredCommandLineId | null;
  unconfiguredLabel?: _build_event_stream_BuildEventId_UnconfiguredLabelId | null;
  buildToolLogs?: _build_event_stream_BuildEventId_BuildToolLogsId | null;
  configuredLabel?: _build_event_stream_BuildEventId_ConfiguredLabelId | null;
  buildMetrics?: _build_event_stream_BuildEventId_BuildMetricsId | null;
  workspace?: _build_event_stream_BuildEventId_WorkspaceConfigId | null;
  buildMetadata?: _build_event_stream_BuildEventId_BuildMetadataId | null;
  convenienceSymlinksIdentified?: _build_event_stream_BuildEventId_ConvenienceSymlinksIdentifiedId | null;
  id?:
    | 'unknown'
    | 'progress'
    | 'started'
    | 'unstructuredCommandLine'
    | 'structuredCommandLine'
    | 'workspaceStatus'
    | 'optionsParsed'
    | 'fetch'
    | 'configuration'
    | 'targetConfigured'
    | 'pattern'
    | 'patternSkipped'
    | 'namedSet'
    | 'targetCompleted'
    | 'actionCompleted'
    | 'unconfiguredLabel'
    | 'configuredLabel'
    | 'testResult'
    | 'testSummary'
    | 'buildFinished'
    | 'buildToolLogs'
    | 'buildMetrics'
    | 'workspace'
    | 'buildMetadata'
    | 'convenienceSymlinksIdentified';
}

/**
 * Identifier for a build event. It is deliberately structured to also provide
 * information about which build target etc the event is related to.
 *
 * Events are chained via the event id as follows: each event has an id and a
 * set of ids of children events such that apart from the initial event each
 * event has an id that is mentioned as child id in an earlier event and a build
 * invocation is complete if and only if all direct and indirect children of the
 * initial event have been posted.
 */
export interface BuildEventId__Output {
  unknown?: _build_event_stream_BuildEventId_UnknownBuildEventId__Output | null;
  progress?: _build_event_stream_BuildEventId_ProgressId__Output | null;
  started?: _build_event_stream_BuildEventId_BuildStartedId__Output | null;
  pattern?: _build_event_stream_BuildEventId_PatternExpandedId__Output | null;
  targetCompleted?: _build_event_stream_BuildEventId_TargetCompletedId__Output | null;
  actionCompleted?: _build_event_stream_BuildEventId_ActionCompletedId__Output | null;
  testSummary?: _build_event_stream_BuildEventId_TestSummaryId__Output | null;
  testResult?: _build_event_stream_BuildEventId_TestResultId__Output | null;
  buildFinished?: _build_event_stream_BuildEventId_BuildFinishedId__Output | null;
  patternSkipped?: _build_event_stream_BuildEventId_PatternExpandedId__Output | null;
  unstructuredCommandLine?: _build_event_stream_BuildEventId_UnstructuredCommandLineId__Output | null;
  optionsParsed?: _build_event_stream_BuildEventId_OptionsParsedId__Output | null;
  namedSet?: _build_event_stream_BuildEventId_NamedSetOfFilesId__Output | null;
  workspaceStatus?: _build_event_stream_BuildEventId_WorkspaceStatusId__Output | null;
  configuration?: _build_event_stream_BuildEventId_ConfigurationId__Output | null;
  targetConfigured?: _build_event_stream_BuildEventId_TargetConfiguredId__Output | null;
  fetch?: _build_event_stream_BuildEventId_FetchId__Output | null;
  structuredCommandLine?: _build_event_stream_BuildEventId_StructuredCommandLineId__Output | null;
  unconfiguredLabel?: _build_event_stream_BuildEventId_UnconfiguredLabelId__Output | null;
  buildToolLogs?: _build_event_stream_BuildEventId_BuildToolLogsId__Output | null;
  configuredLabel?: _build_event_stream_BuildEventId_ConfiguredLabelId__Output | null;
  buildMetrics?: _build_event_stream_BuildEventId_BuildMetricsId__Output | null;
  workspace?: _build_event_stream_BuildEventId_WorkspaceConfigId__Output | null;
  buildMetadata?: _build_event_stream_BuildEventId_BuildMetadataId__Output | null;
  convenienceSymlinksIdentified?: _build_event_stream_BuildEventId_ConvenienceSymlinksIdentifiedId__Output | null;
  id:
    | 'unknown'
    | 'progress'
    | 'started'
    | 'unstructuredCommandLine'
    | 'structuredCommandLine'
    | 'workspaceStatus'
    | 'optionsParsed'
    | 'fetch'
    | 'configuration'
    | 'targetConfigured'
    | 'pattern'
    | 'patternSkipped'
    | 'namedSet'
    | 'targetCompleted'
    | 'actionCompleted'
    | 'unconfiguredLabel'
    | 'configuredLabel'
    | 'testResult'
    | 'testSummary'
    | 'buildFinished'
    | 'buildToolLogs'
    | 'buildMetrics'
    | 'workspace'
    | 'buildMetadata'
    | 'convenienceSymlinksIdentified';
}
