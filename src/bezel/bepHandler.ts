import path = require('path');
import * as vscode from 'vscode';
import * as protobuf from 'protobufjs';
import { OrderedBuildEvent } from '../proto/google/devtools/build/v1/OrderedBuildEvent';
import { BuildEvent as BuildEventStreamEvent } from '../proto/build_event_stream/BuildEvent';
import { BuildEvent } from '../proto/google/devtools/build/v1/BuildEvent';

export interface BazelBuildEvent {
    obe: OrderedBuildEvent
    be: BuildEvent
    bes: BuildEventStreamEvent
    token: vscode.CancellationToken
}

export class BuildEventProtocolHandler {
    constructor(
        protected buildEventType: protobuf.Type,
        protected emitter: vscode.EventEmitter<BazelBuildEvent>,
        protected token: vscode.CancellationToken,
    ) {
    }

    async handleOrderedBuildEvents(obes: OrderedBuildEvent[] | undefined): Promise<void> {
        if (!obes) {
            return;
        }
        for (const obe of obes) {
            this.handleOrderedBuildEvent(obe);
        }
    }

    async handleOrderedBuildEvent(obe: OrderedBuildEvent): Promise<void> {
        if (obe.event) {
            return this.handleBuildEvent(obe, obe.event);
        }
    }

    async handleBuildEvent(obe: OrderedBuildEvent, be: BuildEvent): Promise<void> {
        if (!be.bazelEvent) {
            return;
        }
        const any = be.bazelEvent as {
            type_url: string;
            value: Buffer | Uint8Array | string;
        };
        switch (any.type_url) {
            case 'type.googleapis.com/build_event_stream.BuildEvent':
                return this.handleBazelBuildEvent(obe, be, this.makeBesBuildEvent(any.value as Uint8Array));
            default:
                console.warn(`Unknown any type: ${any.type_url}`);
        }
    }

    async handleBazelBuildEvent(obe: OrderedBuildEvent, be: BuildEvent, e: BuildEventStreamEvent) {
        // console.log(`handleBazelBuildEvent "${e.payload}"`);
        this.emitter.fire({
            obe: obe,
            be: be,
            bes: e,
            token: this.token,
        });
    }

    makeBesBuildEvent(data: Uint8Array): BuildEventStreamEvent {
        return this.buildEventType.toObject(this.buildEventType.decode(data), {
            // keepCase: false,
            longs: String,
            enums: String,
            defaults: false,
            oneofs: true
        });
    }
}