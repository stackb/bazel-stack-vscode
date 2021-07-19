import { ComponentConfiguration } from '../bezel/configuration';

/**
 * Configuration for the buildifier module.
 */
export interface BuildifierConfiguration extends ComponentConfiguration {
  githubOwner: string;
  githubRepo: string;
  githubRelease: string;
  executable: string | undefined;
  fixOnFormat: boolean;
}
