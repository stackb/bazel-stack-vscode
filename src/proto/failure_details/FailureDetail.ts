// Original file: proto/failure_details.proto

import type {
  Interrupted as _failure_details_Interrupted,
  Interrupted__Output as _failure_details_Interrupted__Output,
} from '../failure_details/Interrupted';
import type {
  ExternalRepository as _failure_details_ExternalRepository,
  ExternalRepository__Output as _failure_details_ExternalRepository__Output,
} from '../failure_details/ExternalRepository';
import type {
  BuildProgress as _failure_details_BuildProgress,
  BuildProgress__Output as _failure_details_BuildProgress__Output,
} from '../failure_details/BuildProgress';
import type {
  RemoteOptions as _failure_details_RemoteOptions,
  RemoteOptions__Output as _failure_details_RemoteOptions__Output,
} from '../failure_details/RemoteOptions';
import type {
  ClientEnvironment as _failure_details_ClientEnvironment,
  ClientEnvironment__Output as _failure_details_ClientEnvironment__Output,
} from '../failure_details/ClientEnvironment';
import type {
  Crash as _failure_details_Crash,
  Crash__Output as _failure_details_Crash__Output,
} from '../failure_details/Crash';
import type {
  SymlinkForest as _failure_details_SymlinkForest,
  SymlinkForest__Output as _failure_details_SymlinkForest__Output,
} from '../failure_details/SymlinkForest';
import type {
  PackageOptions as _failure_details_PackageOptions,
  PackageOptions__Output as _failure_details_PackageOptions__Output,
} from '../failure_details/PackageOptions';
import type {
  RemoteExecution as _failure_details_RemoteExecution,
  RemoteExecution__Output as _failure_details_RemoteExecution__Output,
} from '../failure_details/RemoteExecution';

/**
 * The FailureDetail message type is designed such that consumers can extract a
 * basic classification of a FailureDetail message even if the consumer was
 * built with a stale definition. This forward compatibility is implemented via
 * conventions on FailureDetail and its submessage types, as follows.
 *
 * *** FailureDetail field numbers
 *
 * Field numbers 1 through 100 (inclusive) are reserved for generally applicable
 * values. Any number of these fields may be set on a FailureDetail message.
 *
 * Field numbers 101 through 10,000 (inclusive) are reserved for use inside the
 * "oneof" structure. Only one of these values should be set on a FailureDetail
 * message.
 *
 * Additional fields numbers are unlikely to be needed, but, for extreme future-
 * proofing purposes, field numbers 10,001 through 1,000,000 (inclusive;
 * excluding protobuf's reserved range 19000 through 19999) are reserved for
 * additional generally applicable values.
 *
 * *** FailureDetail's "oneof" submessages
 *
 * Each field in the "oneof" structure is a submessage corresponding to a
 * category of failure.
 *
 * In each of these submessage types, field number 1 is an enum whose values
 * correspond to a subcategory of the failure. Generally, the enum's constant
 * which maps to 0 should be interpreted as "unspecified", though this is not
 * required.
 *
 * *** Recommended forward compatibility strategy
 *
 * The recommended forward compatibility strategy is to reduce a FailureDetail
 * message to a pair of integers.
 *
 * The first integer corresponds to the field number of the submessage set
 * inside FailureDetail's "oneof", which corresponds with the failure's
 * category.
 *
 * The second integer corresponds to the value of the enum at field number 1
 * within that submessage, which corresponds with the failure's subcategory.
 *
 * WARNING: This functionality is experimental and should not be relied on at
 * this time.
 * TODO(mschaller): remove experimental warning
 */
export interface FailureDetail {
  /**
   * A short human-readable message describing the failure, for debugging.
   *
   * This value is *not* intended to be used algorithmically.
   */
  message?: string;
  interrupted?: _failure_details_Interrupted | null;
  externalRepository?: _failure_details_ExternalRepository | null;
  buildProgress?: _failure_details_BuildProgress | null;
  remoteOptions?: _failure_details_RemoteOptions | null;
  clientEnvironment?: _failure_details_ClientEnvironment | null;
  crash?: _failure_details_Crash | null;
  symlinkForest?: _failure_details_SymlinkForest | null;
  packageOptions?: _failure_details_PackageOptions | null;
  remoteExecution?: _failure_details_RemoteExecution | null;
  category?:
    | 'interrupted'
    | 'externalRepository'
    | 'buildProgress'
    | 'remoteOptions'
    | 'clientEnvironment'
    | 'crash'
    | 'symlinkForest'
    | 'packageOptions'
    | 'remoteExecution';
}

/**
 * The FailureDetail message type is designed such that consumers can extract a
 * basic classification of a FailureDetail message even if the consumer was
 * built with a stale definition. This forward compatibility is implemented via
 * conventions on FailureDetail and its submessage types, as follows.
 *
 * *** FailureDetail field numbers
 *
 * Field numbers 1 through 100 (inclusive) are reserved for generally applicable
 * values. Any number of these fields may be set on a FailureDetail message.
 *
 * Field numbers 101 through 10,000 (inclusive) are reserved for use inside the
 * "oneof" structure. Only one of these values should be set on a FailureDetail
 * message.
 *
 * Additional fields numbers are unlikely to be needed, but, for extreme future-
 * proofing purposes, field numbers 10,001 through 1,000,000 (inclusive;
 * excluding protobuf's reserved range 19000 through 19999) are reserved for
 * additional generally applicable values.
 *
 * *** FailureDetail's "oneof" submessages
 *
 * Each field in the "oneof" structure is a submessage corresponding to a
 * category of failure.
 *
 * In each of these submessage types, field number 1 is an enum whose values
 * correspond to a subcategory of the failure. Generally, the enum's constant
 * which maps to 0 should be interpreted as "unspecified", though this is not
 * required.
 *
 * *** Recommended forward compatibility strategy
 *
 * The recommended forward compatibility strategy is to reduce a FailureDetail
 * message to a pair of integers.
 *
 * The first integer corresponds to the field number of the submessage set
 * inside FailureDetail's "oneof", which corresponds with the failure's
 * category.
 *
 * The second integer corresponds to the value of the enum at field number 1
 * within that submessage, which corresponds with the failure's subcategory.
 *
 * WARNING: This functionality is experimental and should not be relied on at
 * this time.
 * TODO(mschaller): remove experimental warning
 */
export interface FailureDetail__Output {
  /**
   * A short human-readable message describing the failure, for debugging.
   *
   * This value is *not* intended to be used algorithmically.
   */
  message: string;
  interrupted?: _failure_details_Interrupted__Output | null;
  externalRepository?: _failure_details_ExternalRepository__Output | null;
  buildProgress?: _failure_details_BuildProgress__Output | null;
  remoteOptions?: _failure_details_RemoteOptions__Output | null;
  clientEnvironment?: _failure_details_ClientEnvironment__Output | null;
  crash?: _failure_details_Crash__Output | null;
  symlinkForest?: _failure_details_SymlinkForest__Output | null;
  packageOptions?: _failure_details_PackageOptions__Output | null;
  remoteExecution?: _failure_details_RemoteExecution__Output | null;
  category:
    | 'interrupted'
    | 'externalRepository'
    | 'buildProgress'
    | 'remoteOptions'
    | 'clientEnvironment'
    | 'crash'
    | 'symlinkForest'
    | 'packageOptions'
    | 'remoteExecution';
}
