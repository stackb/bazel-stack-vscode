/**
 * Configuration for the buildifier module.
 */
export type BuildifierConfiguration = {
  githubOwner: string;
  githubRepo: string;
  githubRelease: string;
  executable: string | undefined;
  fixOnFormat: boolean;
};
