
/**
 * Configuration for the buildifier module.
 */
export type BuildifierConfiguration = {
    owner: string,
    repo: string,
    releaseTag: string,
    executable: string,
    fixOnFormat: boolean,
};