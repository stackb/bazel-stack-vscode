// Original file: proto/bzl.proto

export interface Package {
  /**
   * The name of the package (similar to a dir basename)
   */
  name?: string;
  /**
   * The dir path
   */
  dir?: string;
}

export interface Package__Output {
  /**
   * The name of the package (similar to a dir basename)
   */
  name: string;
  /**
   * The dir path
   */
  dir: string;
}
