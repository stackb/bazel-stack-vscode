import { ComponentConfiguration } from '../bezel/configuration';

/**
 * Configuration for the golang module.
 */
export interface GolangConfiguration extends ComponentConfiguration {
  gopackagesdriver: GopackagesdriverClientConfiguration;
}

/**
 * Configuration for the gopackagesdriver.
 */
export interface GopackagesdriverClientConfiguration {
  // The release of gopackagesdriver
  release: string;
  // Path to gopackagesdriver frontend
  executable: string;
  // Path to gopackagesdriver entrypoint script
  script: string;
  // optional flags for gopackagesdriver
  flags: string[] | undefined;
  // name of the bazel workspace of the go_sdk
  goSdkWorkspaceName: string;
}
