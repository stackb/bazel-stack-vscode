// Original file: proto/semver.proto


/**
 * The full version of a given tool.
 */
export interface SemVer {
  /**
   * The major version, e.g 10 for 10.2.3.
   */
  'major'?: (number);
  /**
   * The minor version, e.g. 2 for 10.2.3.
   */
  'minor'?: (number);
  /**
   * The patch version, e.g 3 for 10.2.3.
   */
  'patch'?: (number);
  /**
   * The pre-release version. Either this field or major/minor/patch fields
   * must be filled. They are mutually exclusive. Pre-release versions are
   * assumed to be earlier than any released versions.
   */
  'prerelease'?: (string);
}

/**
 * The full version of a given tool.
 */
export interface SemVer__Output {
  /**
   * The major version, e.g 10 for 10.2.3.
   */
  'major': (number);
  /**
   * The minor version, e.g. 2 for 10.2.3.
   */
  'minor': (number);
  /**
   * The patch version, e.g 3 for 10.2.3.
   */
  'patch': (number);
  /**
   * The pre-release version. Either this field or major/minor/patch fields
   * must be filled. They are mutually exclusive. Pre-release versions are
   * assumed to be earlier than any released versions.
   */
  'prerelease': (string);
}
