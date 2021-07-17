import type * as grpc from '@grpc/grpc-js';
import type { MessageTypeDefinition } from '@grpc/proto-loader';

import type {
  ActionCacheClient as _build_bazel_remote_execution_v2_ActionCacheClient,
  ActionCacheDefinition as _build_bazel_remote_execution_v2_ActionCacheDefinition,
} from './build/bazel/remote/execution/v2/ActionCache';
import type {
  CapabilitiesClient as _build_bazel_remote_execution_v2_CapabilitiesClient,
  CapabilitiesDefinition as _build_bazel_remote_execution_v2_CapabilitiesDefinition,
} from './build/bazel/remote/execution/v2/Capabilities';
import type {
  ContentAddressableStorageClient as _build_bazel_remote_execution_v2_ContentAddressableStorageClient,
  ContentAddressableStorageDefinition as _build_bazel_remote_execution_v2_ContentAddressableStorageDefinition,
} from './build/bazel/remote/execution/v2/ContentAddressableStorage';
import type {
  ExecutionClient as _build_bazel_remote_execution_v2_ExecutionClient,
  ExecutionDefinition as _build_bazel_remote_execution_v2_ExecutionDefinition,
} from './build/bazel/remote/execution/v2/Execution';
import type {
  OperationsClient as _google_longrunning_OperationsClient,
  OperationsDefinition as _google_longrunning_OperationsDefinition,
} from './google/longrunning/Operations';

type SubtypeConstructor<Constructor extends new (...args: any) => any, Subtype> = {
  new (...args: ConstructorParameters<Constructor>): Subtype;
};

export interface ProtoGrpcType {
  build: {
    bazel: {
      remote: {
        execution: {
          v2: {
            Action: MessageTypeDefinition;
            /**
             * The action cache API is used to query whether a given action has already been
             * performed and, if so, retrieve its result. Unlike the
             * [ContentAddressableStorage][build.bazel.remote.execution.v2.ContentAddressableStorage],
             * which addresses blobs by their own content, the action cache addresses the
             * [ActionResult][build.bazel.remote.execution.v2.ActionResult] by a
             * digest of the encoded [Action][build.bazel.remote.execution.v2.Action]
             * which produced them.
             *
             * The lifetime of entries in the action cache is implementation-specific, but
             * the server SHOULD assume that more recently used entries are more likely to
             * be used again.
             *
             * As with other services in the Remote Execution API, any call may return an
             * error with a [RetryInfo][google.rpc.RetryInfo] error detail providing
             * information about when the client should retry the request; clients SHOULD
             * respect the information provided.
             */
            ActionCache: SubtypeConstructor<
              typeof grpc.Client,
              _build_bazel_remote_execution_v2_ActionCacheClient
            > & { service: _build_bazel_remote_execution_v2_ActionCacheDefinition };
            ActionCacheUpdateCapabilities: MessageTypeDefinition;
            ActionResult: MessageTypeDefinition;
            BatchReadBlobsRequest: MessageTypeDefinition;
            BatchReadBlobsResponse: MessageTypeDefinition;
            BatchUpdateBlobsRequest: MessageTypeDefinition;
            BatchUpdateBlobsResponse: MessageTypeDefinition;
            CacheCapabilities: MessageTypeDefinition;
            /**
             * The Capabilities service may be used by remote execution clients to query
             * various server properties, in order to self-configure or return meaningful
             * error messages.
             *
             * The query may include a particular `instance_name`, in which case the values
             * returned will pertain to that instance.
             */
            Capabilities: SubtypeConstructor<
              typeof grpc.Client,
              _build_bazel_remote_execution_v2_CapabilitiesClient
            > & { service: _build_bazel_remote_execution_v2_CapabilitiesDefinition };
            Command: MessageTypeDefinition;
            /**
             * The CAS (content-addressable storage) is used to store the inputs to and
             * outputs from the execution service. Each piece of content is addressed by the
             * digest of its binary data.
             *
             * Most of the binary data stored in the CAS is opaque to the execution engine,
             * and is only used as a communication medium. In order to build an
             * [Action][build.bazel.remote.execution.v2.Action],
             * however, the client will need to also upload the
             * [Command][build.bazel.remote.execution.v2.Command] and input root
             * [Directory][build.bazel.remote.execution.v2.Directory] for the Action.
             * The Command and Directory messages must be marshalled to wire format and then
             * uploaded under the hash as with any other piece of content. In practice, the
             * input root directory is likely to refer to other Directories in its
             * hierarchy, which must also each be uploaded on their own.
             *
             * For small file uploads the client should group them together and call
             * [BatchUpdateBlobs][build.bazel.remote.execution.v2.ContentAddressableStorage.BatchUpdateBlobs].
             * For large uploads, the client must use the
             * [Write method][google.bytestream.ByteStream.Write] of the ByteStream API. The
             * `resource_name` is `{instance_name}/uploads/{uuid}/blobs/{hash}/{size}`,
             * where `instance_name` is as described in the next paragraph, `uuid` is a
             * version 4 UUID generated by the client, and `hash` and `size` are the
             * [Digest][build.bazel.remote.execution.v2.Digest] of the blob. The
             * `uuid` is used only to avoid collisions when multiple clients try to upload
             * the same file (or the same client tries to upload the file multiple times at
             * once on different threads), so the client MAY reuse the `uuid` for uploading
             * different blobs. The `resource_name` may optionally have a trailing filename
             * (or other metadata) for a client to use if it is storing URLs, as in
             * `{instance}/uploads/{uuid}/blobs/{hash}/{size}/foo/bar/baz.cc`. Anything
             * after the `size` is ignored.
             *
             * A single server MAY support multiple instances of the execution system, each
             * with their own workers, storage, cache, etc. The exact relationship between
             * instances is up to the server. If the server does, then the `instance_name`
             * is an identifier, possibly containing multiple path segments, used to
             * distinguish between the various instances on the server, in a manner defined
             * by the server. For servers which do not support multiple instances, then the
             * `instance_name` is the empty path and the leading slash is omitted, so that
             * the `resource_name` becomes `uploads/{uuid}/blobs/{hash}/{size}`.
             * To simplify parsing, a path segment cannot equal any of the following
             * keywords: `blobs`, `uploads`, `actions`, `actionResults`, `operations` and
             * `capabilities`.
             *
             * When attempting an upload, if another client has already completed the upload
             * (which may occur in the middle of a single upload if another client uploads
             * the same blob concurrently), the request will terminate immediately with
             * a response whose `committed_size` is the full size of the uploaded file
             * (regardless of how much data was transmitted by the client). If the client
             * completes the upload but the
             * [Digest][build.bazel.remote.execution.v2.Digest] does not match, an
             * `INVALID_ARGUMENT` error will be returned. In either case, the client should
             * not attempt to retry the upload.
             *
             * For downloading blobs, the client must use the
             * [Read method][google.bytestream.ByteStream.Read] of the ByteStream API, with
             * a `resource_name` of `"{instance_name}/blobs/{hash}/{size}"`, where
             * `instance_name` is the instance name (see above), and `hash` and `size` are
             * the [Digest][build.bazel.remote.execution.v2.Digest] of the blob.
             *
             * The lifetime of entries in the CAS is implementation specific, but it SHOULD
             * be long enough to allow for newly-added and recently looked-up entries to be
             * used in subsequent calls (e.g. to
             * [Execute][build.bazel.remote.execution.v2.Execution.Execute]).
             *
             * As with other services in the Remote Execution API, any call may return an
             * error with a [RetryInfo][google.rpc.RetryInfo] error detail providing
             * information about when the client should retry the request; clients SHOULD
             * respect the information provided.
             */
            ContentAddressableStorage: SubtypeConstructor<
              typeof grpc.Client,
              _build_bazel_remote_execution_v2_ContentAddressableStorageClient
            > & { service: _build_bazel_remote_execution_v2_ContentAddressableStorageDefinition };
            Digest: MessageTypeDefinition;
            DigestFunction: MessageTypeDefinition;
            Directory: MessageTypeDefinition;
            DirectoryNode: MessageTypeDefinition;
            ExecuteOperationMetadata: MessageTypeDefinition;
            ExecuteRequest: MessageTypeDefinition;
            ExecuteResponse: MessageTypeDefinition;
            ExecutedActionMetadata: MessageTypeDefinition;
            /**
             * The Remote Execution API is used to execute an
             * [Action][build.bazel.remote.execution.v2.Action] on the remote
             * workers.
             *
             * As with other services in the Remote Execution API, any call may return an
             * error with a [RetryInfo][google.rpc.RetryInfo] error detail providing
             * information about when the client should retry the request; clients SHOULD
             * respect the information provided.
             */
            Execution: SubtypeConstructor<
              typeof grpc.Client,
              _build_bazel_remote_execution_v2_ExecutionClient
            > & { service: _build_bazel_remote_execution_v2_ExecutionDefinition };
            ExecutionCapabilities: MessageTypeDefinition;
            ExecutionPolicy: MessageTypeDefinition;
            ExecutionStage: MessageTypeDefinition;
            ExecutionTask: MessageTypeDefinition;
            FileNode: MessageTypeDefinition;
            FindMissingBlobsRequest: MessageTypeDefinition;
            FindMissingBlobsResponse: MessageTypeDefinition;
            GetActionResultRequest: MessageTypeDefinition;
            GetCapabilitiesRequest: MessageTypeDefinition;
            GetTreeRequest: MessageTypeDefinition;
            GetTreeResponse: MessageTypeDefinition;
            LogFile: MessageTypeDefinition;
            NodeProperty: MessageTypeDefinition;
            OutputDirectory: MessageTypeDefinition;
            OutputFile: MessageTypeDefinition;
            OutputSymlink: MessageTypeDefinition;
            Platform: MessageTypeDefinition;
            PriorityCapabilities: MessageTypeDefinition;
            PublishOperationResponse: MessageTypeDefinition;
            RequestMetadata: MessageTypeDefinition;
            ResultsCachePolicy: MessageTypeDefinition;
            ServerCapabilities: MessageTypeDefinition;
            SizedDirectory: MessageTypeDefinition;
            SymlinkAbsolutePathStrategy: MessageTypeDefinition;
            SymlinkNode: MessageTypeDefinition;
            ToolDetails: MessageTypeDefinition;
            Tree: MessageTypeDefinition;
            TreeToken: MessageTypeDefinition;
            UpdateActionResultRequest: MessageTypeDefinition;
            WaitExecutionRequest: MessageTypeDefinition;
          };
        };
      };
      semver: {
        SemVer: MessageTypeDefinition;
      };
    };
  };
  google: {
    api: {
      CustomHttpPattern: MessageTypeDefinition;
      Http: MessageTypeDefinition;
      HttpRule: MessageTypeDefinition;
    };
    longrunning: {
      CancelOperationRequest: MessageTypeDefinition;
      DeleteOperationRequest: MessageTypeDefinition;
      GetOperationRequest: MessageTypeDefinition;
      ListOperationsRequest: MessageTypeDefinition;
      ListOperationsResponse: MessageTypeDefinition;
      Operation: MessageTypeDefinition;
      OperationInfo: MessageTypeDefinition;
      /**
       * Manages long-running operations with an API service.
       *
       * When an API method normally takes long time to complete, it can be designed
       * to return [Operation][google.longrunning.Operation] to the client, and the client can use this
       * interface to receive the real response asynchronously by polling the
       * operation resource, or pass the operation resource to another API (such as
       * Google Cloud Pub/Sub API) to receive the response.  Any API service that
       * returns long-running operations should implement the `Operations` interface
       * so developers can have a consistent client experience.
       */
      Operations: SubtypeConstructor<typeof grpc.Client, _google_longrunning_OperationsClient> & {
        service: _google_longrunning_OperationsDefinition;
      };
      WaitOperationRequest: MessageTypeDefinition;
    };
    protobuf: {
      Any: MessageTypeDefinition;
      DescriptorProto: MessageTypeDefinition;
      Duration: MessageTypeDefinition;
      Empty: MessageTypeDefinition;
      EnumDescriptorProto: MessageTypeDefinition;
      EnumOptions: MessageTypeDefinition;
      EnumValueDescriptorProto: MessageTypeDefinition;
      EnumValueOptions: MessageTypeDefinition;
      FieldDescriptorProto: MessageTypeDefinition;
      FieldOptions: MessageTypeDefinition;
      FileDescriptorProto: MessageTypeDefinition;
      FileDescriptorSet: MessageTypeDefinition;
      FileOptions: MessageTypeDefinition;
      GeneratedCodeInfo: MessageTypeDefinition;
      MessageOptions: MessageTypeDefinition;
      MethodDescriptorProto: MessageTypeDefinition;
      MethodOptions: MessageTypeDefinition;
      OneofDescriptorProto: MessageTypeDefinition;
      OneofOptions: MessageTypeDefinition;
      ServiceDescriptorProto: MessageTypeDefinition;
      ServiceOptions: MessageTypeDefinition;
      SourceCodeInfo: MessageTypeDefinition;
      Timestamp: MessageTypeDefinition;
      UninterpretedOption: MessageTypeDefinition;
    };
    rpc: {
      Status: MessageTypeDefinition;
    };
  };
}
