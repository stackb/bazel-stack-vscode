import { BazelConfiguration, BazelSettings } from './configuration';
import { LaunchableComponent, LaunchArgs, RunnableComponent, Status } from './status';
import { BazelInfo, Bzl } from './bzl';
import { CommandName } from './constants';

export class BazelServer extends LaunchableComponent<BazelConfiguration> {

    private info: BazelInfo | undefined;

    constructor(
        public readonly settings: BazelSettings,
        public readonly bzl: Bzl,
    ) {
        super('BLZ', settings, CommandName.LaunchBazelServer, 'bazel');
        bzl.onDidChangeStatus(s => this.setStatus(s), this, this.disposables);
    }

    async startInternal(): Promise<void> {
        try {
            this.setStatus(Status.STARTING);
            const info = await this.bzl.getBazelInfo();
            this.setStatus(Status.READY);
        } catch (e) {
            this.setError(e);
        }
    }

    async stopInternal(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }

    async getBazelInfo(): Promise<BazelInfo | undefined> {
        if (!this.info) {
            this.info = await this.bzl.getBazelInfo();
        }
        return this.info;
    }

    async getLaunchArgs(): Promise<LaunchArgs> {
        const cfg = await this.settings.get();
        return {
            command: [cfg.executable || 'bazel'],
            noHideOnReady: true,
        };
    }

    async runInBazelTerminal(args: string[]) {
        return this.handleCommandLaunch(args);
    }

}
