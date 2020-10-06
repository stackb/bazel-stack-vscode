// Original file: proto/build_event_stream.proto


export interface File {
  /**
   * identifier indicating the nature of the file (e.g., "stdout", "stderr")
   */
  'name'?: (string);
  /**
   * A location where the contents of the file can be found. The string is
   * encoded according to RFC2396.
   */
  'uri'?: (string);
  /**
   * The contents of the file, if they are guaranteed to be short.
   */
  'contents'?: (Buffer | Uint8Array | string);
  /**
   * A sequence of prefixes to apply to the file name to construct a full path.
   * In most but not all cases, there will be 3 entries:
   * 1. A root output directory, eg "bazel-out"
   * 2. A configuration mnemonic, eg "k8-fastbuild"
   * 3. An output category, eg "genfiles"
   */
  'pathPrefix'?: (string)[];
  'file'?: "uri"|"contents";
}

export interface File__Output {
  /**
   * identifier indicating the nature of the file (e.g., "stdout", "stderr")
   */
  'name': (string);
  /**
   * A location where the contents of the file can be found. The string is
   * encoded according to RFC2396.
   */
  'uri'?: (string);
  /**
   * The contents of the file, if they are guaranteed to be short.
   */
  'contents'?: (Buffer);
  /**
   * A sequence of prefixes to apply to the file name to construct a full path.
   * In most but not all cases, there will be 3 entries:
   * 1. A root output directory, eg "bazel-out"
   * 2. A configuration mnemonic, eg "k8-fastbuild"
   * 3. An output category, eg "genfiles"
   */
  'pathPrefix': (string)[];
  'file': "uri"|"contents";
}
