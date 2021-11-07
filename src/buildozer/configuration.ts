import { ComponentConfiguration } from '../bezel/configuration';

/**
 * Configuration for the buildifier module.
 */
export interface BuildozerConfiguration extends ComponentConfiguration {
  githubOwner: string;
  githubRepo: string;
  githubRelease: string;
  executable: string | undefined;
  options: string[] | undefined;
}
