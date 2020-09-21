// Original file: proto/build_event_stream.proto

import { Long } from '@grpc/proto-loader';

export interface _build_event_stream_BuildMetrics_ActionSummary {
  /**
   * The total number of actions created and registered during the build.
   * This includes unused actions that were constructed but
   * not executed during this build.
   */
  'actionsCreated'?: (number | string | Long);
  /**
   * The total number of actions executed during the build.
   * This includes any remote cache hits, but excludes
   * local action cache hits.
   */
  'actionsExecuted'?: (number | string | Long);
}

export interface _build_event_stream_BuildMetrics_ActionSummary__Output {
  /**
   * The total number of actions created and registered during the build.
   * This includes unused actions that were constructed but
   * not executed during this build.
   */
  'actionsCreated': (Long);
  /**
   * The total number of actions executed during the build.
   * This includes any remote cache hits, but excludes
   * local action cache hits.
   */
  'actionsExecuted': (Long);
}

export interface _build_event_stream_BuildMetrics_MemoryMetrics {
  /**
   * Size of the JVM heap post build in bytes. This is only collected if
   * --bep_publish_used_heap_size_post_build is set,
   * since it forces a full GC.
   */
  'usedHeapSizePostBuild'?: (number | string | Long);
  /**
   * Size of the peak JVM heap size in bytes post GC. Note that this reports 0
   * if there was no major GC during the build.
   */
  'peakPostGcHeapSize'?: (number | string | Long);
}

export interface _build_event_stream_BuildMetrics_MemoryMetrics__Output {
  /**
   * Size of the JVM heap post build in bytes. This is only collected if
   * --bep_publish_used_heap_size_post_build is set,
   * since it forces a full GC.
   */
  'usedHeapSizePostBuild': (Long);
  /**
   * Size of the peak JVM heap size in bytes post GC. Note that this reports 0
   * if there was no major GC during the build.
   */
  'peakPostGcHeapSize': (Long);
}

export interface _build_event_stream_BuildMetrics_PackageMetrics {
  /**
   * Number of BUILD files (aka packages) loaded during this build.
   */
  'packagesLoaded'?: (number | string | Long);
}

export interface _build_event_stream_BuildMetrics_PackageMetrics__Output {
  /**
   * Number of BUILD files (aka packages) loaded during this build.
   */
  'packagesLoaded': (Long);
}

export interface _build_event_stream_BuildMetrics_TargetMetrics {
  /**
   * Number of targets loaded during this build.
   */
  'targetsLoaded'?: (number | string | Long);
  /**
   * Number of targets configured during this build. This can
   * be greater than targets_loaded if the same target is configured
   * multiple times.
   */
  'targetsConfigured'?: (number | string | Long);
}

export interface _build_event_stream_BuildMetrics_TargetMetrics__Output {
  /**
   * Number of targets loaded during this build.
   */
  'targetsLoaded': (Long);
  /**
   * Number of targets configured during this build. This can
   * be greater than targets_loaded if the same target is configured
   * multiple times.
   */
  'targetsConfigured': (Long);
}

export interface _build_event_stream_BuildMetrics_TimingMetrics {
  /**
   * The CPU time in milliseconds consumed during this build.
   */
  'cpuTimeInMs'?: (number | string | Long);
  /**
   * The elapsed wall time in milliseconds during this build.
   */
  'wallTimeInMs'?: (number | string | Long);
}

export interface _build_event_stream_BuildMetrics_TimingMetrics__Output {
  /**
   * The CPU time in milliseconds consumed during this build.
   */
  'cpuTimeInMs': (Long);
  /**
   * The elapsed wall time in milliseconds during this build.
   */
  'wallTimeInMs': (Long);
}

export interface BuildMetrics {
  'actionSummary'?: (_build_event_stream_BuildMetrics_ActionSummary);
  'memoryMetrics'?: (_build_event_stream_BuildMetrics_MemoryMetrics);
  'targetMetrics'?: (_build_event_stream_BuildMetrics_TargetMetrics);
  'packageMetrics'?: (_build_event_stream_BuildMetrics_PackageMetrics);
  'timingMetrics'?: (_build_event_stream_BuildMetrics_TimingMetrics);
}

export interface BuildMetrics__Output {
  'actionSummary'?: (_build_event_stream_BuildMetrics_ActionSummary__Output);
  'memoryMetrics'?: (_build_event_stream_BuildMetrics_MemoryMetrics__Output);
  'targetMetrics'?: (_build_event_stream_BuildMetrics_TargetMetrics__Output);
  'packageMetrics'?: (_build_event_stream_BuildMetrics_PackageMetrics__Output);
  'timingMetrics'?: (_build_event_stream_BuildMetrics_TimingMetrics__Output);
}
