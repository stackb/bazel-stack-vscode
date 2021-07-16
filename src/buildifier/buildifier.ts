import { RunnableComponent, Status } from '../bezel/status';
import { BuildifierConfiguration } from './configuration';
import { BuildifierDiagnosticsManager } from './diagnostics';
import { BuildifierFormatter } from './formatter';
import { BuildifierSettings } from './settings';

export class Buildifier extends RunnableComponent<BuildifierConfiguration> {

  constructor(
    public readonly settings: BuildifierSettings,
  ) {
    super('BDF', settings);

    new BuildifierDiagnosticsManager(settings, this.disposables);
    new BuildifierFormatter(settings, this.disposables);
  }

  async startInternal(): Promise<void> {
    // start calls settings such that we discover a configuration error upon
    // startup.
    try {
      await this.settings.get();
      this.setStatus(Status.READY);
    } catch (e) {
      this.setError(e);
    }
  }

  async stopInternal(): Promise<void> {
    this.setStatus(Status.STOPPED);
  }

}
