import * as vscode from 'vscode';
import * as grpc from '@grpc/grpc-js';
import * as loader from '@grpc/proto-loader';
import { BazelConfiguration, BazelSettings } from './configuration';
import { RunnableComponent, Status } from './status';
import { BazelInfo, Bzl } from './bzl';
import { CommandName } from './constants';

export class BazelServer extends RunnableComponent<BazelConfiguration> {

    private info: BazelInfo | undefined;

    constructor(
        public readonly settings: BazelSettings,
        public readonly bzl: Bzl,
    ) {
        super(settings);
        bzl.onDidChangeStatus(s => this.setStatus(s), this, this.disposables);
    }

    async start(): Promise<void> {
        try {
            this.setStatus(Status.STARTING);
            const info = await this.bzl.client?.getBazelInfo();
            this.setStatus(Status.READY);
        } catch (e) {
            this.setError(e);
        }
    }

    async stop(): Promise<void> {
        this.setStatus(Status.STOPPED);
    }
    
    async getBazelInfo(): Promise<BazelInfo | undefined> {
        if (!this.info) {
            this.info = await this.bzl.client?.getBazelInfo();
        }
        return this.info;
    }

}
