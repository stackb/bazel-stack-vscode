// GENERATED CODE -- DO NOT EDIT!

'use strict';
var grpc = require('@grpc/grpc-js');
var build_stack_bzl_v1beta1_application_pb = require('../../../../build/stack/bzl/v1beta1/application_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');

function serialize_build_stack_bzl_v1beta1_ApplicationMetadata(arg) {
  if (!(arg instanceof build_stack_bzl_v1beta1_application_pb.ApplicationMetadata)) {
    throw new Error('Expected argument of type build.stack.bzl.v1beta1.ApplicationMetadata');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_build_stack_bzl_v1beta1_ApplicationMetadata(buffer_arg) {
  return build_stack_bzl_v1beta1_application_pb.ApplicationMetadata.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_build_stack_bzl_v1beta1_GetApplicationMetadataRequest(arg) {
  if (!(arg instanceof build_stack_bzl_v1beta1_application_pb.GetApplicationMetadataRequest)) {
    throw new Error('Expected argument of type build.stack.bzl.v1beta1.GetApplicationMetadataRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_build_stack_bzl_v1beta1_GetApplicationMetadataRequest(buffer_arg) {
  return build_stack_bzl_v1beta1_application_pb.GetApplicationMetadataRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Application service provides metadata about the bzl application
var ApplicationService = exports.ApplicationService = {
  getApplicationMetadata: {
    path: '/build.stack.bzl.v1beta1.Application/GetApplicationMetadata',
    requestStream: false,
    responseStream: false,
    requestType: build_stack_bzl_v1beta1_application_pb.GetApplicationMetadataRequest,
    responseType: build_stack_bzl_v1beta1_application_pb.ApplicationMetadata,
    requestSerialize: serialize_build_stack_bzl_v1beta1_GetApplicationMetadataRequest,
    requestDeserialize: deserialize_build_stack_bzl_v1beta1_GetApplicationMetadataRequest,
    responseSerialize: serialize_build_stack_bzl_v1beta1_ApplicationMetadata,
    responseDeserialize: deserialize_build_stack_bzl_v1beta1_ApplicationMetadata,
  },
};

exports.ApplicationClient = grpc.makeGenericClientConstructor(ApplicationService);
