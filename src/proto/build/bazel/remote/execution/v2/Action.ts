// Original file: proto/remote_execution.proto

import type { Digest as _build_bazel_remote_execution_v2_Digest, Digest__Output as _build_bazel_remote_execution_v2_Digest__Output } from '../../../../../build/bazel/remote/execution/v2/Digest';
import type { Duration as _google_protobuf_Duration, Duration__Output as _google_protobuf_Duration__Output } from '../../../../../google/protobuf/Duration';

/**
 * An `Action` captures all the information about an execution which is required
 * to reproduce it.
 * 
 * `Action`s are the core component of the [Execution] service. A single
 * `Action` represents a repeatable action that can be performed by the
 * execution service. `Action`s can be succinctly identified by the digest of
 * their wire format encoding and, once an `Action` has been executed, will be
 * cached in the action cache. Future requests can then use the cached result
 * rather than needing to run afresh.
 * 
 * When a server completes execution of an
 * [Action][build.bazel.remote.execution.v2.Action], it MAY choose to
 * cache the [result][build.bazel.remote.execution.v2.ActionResult] in
 * the [ActionCache][build.bazel.remote.execution.v2.ActionCache] unless
 * `do_not_cache` is `true`. Clients SHOULD expect the server to do so. By
 * default, future calls to
 * [Execute][build.bazel.remote.execution.v2.Execution.Execute] the same
 * `Action` will also serve their results from the cache. Clients must take care
 * to understand the caching behaviour. Ideally, all `Action`s will be
 * reproducible so that serving a result from cache is always desirable and
 * correct.
 */
export interface Action {
  /**
   * The digest of the [Command][build.bazel.remote.execution.v2.Command]
   * to run, which MUST be present in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'commandDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * The digest of the root
   * [Directory][build.bazel.remote.execution.v2.Directory] for the input
   * files. The files in the directory tree are available in the correct
   * location on the build machine before the command is executed. The root
   * directory, as well as every subdirectory and content blob referred to, MUST
   * be in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'inputRootDigest'?: (_build_bazel_remote_execution_v2_Digest | null);
  /**
   * A timeout after which the execution should be killed. If the timeout is
   * absent, then the client is specifying that the execution should continue
   * as long as the server will let it. The server SHOULD impose a timeout if
   * the client does not specify one, however, if the client does specify a
   * timeout that is longer than the server's maximum timeout, the server MUST
   * reject the request.
   * 
   * The timeout is a part of the
   * [Action][build.bazel.remote.execution.v2.Action] message, and
   * therefore two `Actions` with different timeouts are different, even if they
   * are otherwise identical. This is because, if they were not, running an
   * `Action` with a lower timeout than is required might result in a cache hit
   * from an execution run with a longer timeout, hiding the fact that the
   * timeout is too short. By encoding it directly in the `Action`, a lower
   * timeout will result in a cache miss and the execution timeout will fail
   * immediately, rather than whenever the cache entry gets evicted.
   */
  'timeout'?: (_google_protobuf_Duration | null);
  /**
   * If true, then the `Action`'s result cannot be cached, and in-flight
   * requests for the same `Action` may not be merged.
   */
  'doNotCache'?: (boolean);
  /**
   * List of required supported
   * [NodeProperty][build.bazel.remote.execution.v2.NodeProperty] keys. In order
   * to ensure that equivalent `Action`s always hash to the same value, the
   * supported node properties MUST be lexicographically sorted by name. Sorting
   * of strings is done by code point, equivalently, by the UTF-8 bytes.
   * 
   * The interpretation of these properties is server-dependent. If a property
   * is not recognized by the server, the server will return an
   * `INVALID_ARGUMENT` error.
   */
  'outputNodeProperties'?: (string)[];
}

/**
 * An `Action` captures all the information about an execution which is required
 * to reproduce it.
 * 
 * `Action`s are the core component of the [Execution] service. A single
 * `Action` represents a repeatable action that can be performed by the
 * execution service. `Action`s can be succinctly identified by the digest of
 * their wire format encoding and, once an `Action` has been executed, will be
 * cached in the action cache. Future requests can then use the cached result
 * rather than needing to run afresh.
 * 
 * When a server completes execution of an
 * [Action][build.bazel.remote.execution.v2.Action], it MAY choose to
 * cache the [result][build.bazel.remote.execution.v2.ActionResult] in
 * the [ActionCache][build.bazel.remote.execution.v2.ActionCache] unless
 * `do_not_cache` is `true`. Clients SHOULD expect the server to do so. By
 * default, future calls to
 * [Execute][build.bazel.remote.execution.v2.Execution.Execute] the same
 * `Action` will also serve their results from the cache. Clients must take care
 * to understand the caching behaviour. Ideally, all `Action`s will be
 * reproducible so that serving a result from cache is always desirable and
 * correct.
 */
export interface Action__Output {
  /**
   * The digest of the [Command][build.bazel.remote.execution.v2.Command]
   * to run, which MUST be present in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'commandDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * The digest of the root
   * [Directory][build.bazel.remote.execution.v2.Directory] for the input
   * files. The files in the directory tree are available in the correct
   * location on the build machine before the command is executed. The root
   * directory, as well as every subdirectory and content blob referred to, MUST
   * be in the
   * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage].
   */
  'inputRootDigest': (_build_bazel_remote_execution_v2_Digest__Output | null);
  /**
   * A timeout after which the execution should be killed. If the timeout is
   * absent, then the client is specifying that the execution should continue
   * as long as the server will let it. The server SHOULD impose a timeout if
   * the client does not specify one, however, if the client does specify a
   * timeout that is longer than the server's maximum timeout, the server MUST
   * reject the request.
   * 
   * The timeout is a part of the
   * [Action][build.bazel.remote.execution.v2.Action] message, and
   * therefore two `Actions` with different timeouts are different, even if they
   * are otherwise identical. This is because, if they were not, running an
   * `Action` with a lower timeout than is required might result in a cache hit
   * from an execution run with a longer timeout, hiding the fact that the
   * timeout is too short. By encoding it directly in the `Action`, a lower
   * timeout will result in a cache miss and the execution timeout will fail
   * immediately, rather than whenever the cache entry gets evicted.
   */
  'timeout': (_google_protobuf_Duration__Output | null);
  /**
   * If true, then the `Action`'s result cannot be cached, and in-flight
   * requests for the same `Action` may not be merged.
   */
  'doNotCache': (boolean);
  /**
   * List of required supported
   * [NodeProperty][build.bazel.remote.execution.v2.NodeProperty] keys. In order
   * to ensure that equivalent `Action`s always hash to the same value, the
   * supported node properties MUST be lexicographically sorted by name. Sorting
   * of strings is done by code point, equivalently, by the UTF-8 bytes.
   * 
   * The interpretation of these properties is server-dependent. If a property
   * is not recognized by the server, the server will return an
   * `INVALID_ARGUMENT` error.
   */
  'outputNodeProperties': (string)[];
}
