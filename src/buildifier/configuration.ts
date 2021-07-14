/**
 * Configuration for the buildifier module.
 */
export type BuildifierConfiguration = {
  owner: string;
  repo: string;
  release: string;
  executable: string | undefined;
  fixOnFormat: boolean;
};
