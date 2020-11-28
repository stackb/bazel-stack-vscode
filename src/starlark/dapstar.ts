import * as Net from 'net';
import * as vscode from 'vscode';
import { BazelDebugSession } from './debug/client';

const DapstarDebugTypeName = 'dapstar';

export class Dapstar implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];

    constructor() {
        if (false) {
            this.disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory(
                DapstarDebugTypeName,
                new DapstarDebugAdapterExecutableFactory()));
        }
        this.disposables.push(vscode.debug.registerDebugAdapterDescriptorFactory(
            DapstarDebugTypeName,
            new DapstarDebugAdapterServerDescriptorFactory()));
        this.disposables.push(vscode.debug.registerDebugAdapterTrackerFactory(
            DapstarDebugTypeName,
            new DapstarDebugAdapterTrackerFactory()));
    }

    public dispose() {
        for (const disposable of this.disposables) {
            disposable.dispose();
        }
        this.disposables.length = 0;
    }
}


class DapstarDebugAdapterExecutableFactory implements vscode.DebugAdapterDescriptorFactory {
    createDebugAdapterDescriptor(_session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        const command = '/Users/i868039/go/src/github.com/stackb/bezel/bazel-bin/cmd/dapstar/darwin_amd64_static_pure_stripped/dapstar';
        const args: string[] = [];
        const options = {
            cwd: '.',
            // env: { "envVariable": "some value" }
        };
        return new vscode.DebugAdapterExecutable(command, args, options);
    }
}

class DapstarDebugAdapterServerDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

    private server?: Net.Server;

    createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {

        if (!this.server) {
            // start listening on a random port
            this.server = Net.createServer(socket => {
                const session = new BazelDebugSession();
                session.setRunAsServer(true);
                session.start(socket as NodeJS.ReadableStream, socket);
            }).listen(0);
        }

        // make VS Code connect to debug server
        return new vscode.DebugAdapterServer((this.server.address() as Net.AddressInfo).port);
    }

    dispose() {
        if (this.server) {
            this.server.close();
        }
    }
}

class DapstarDebugAdapterTrackerFactory implements vscode.DebugAdapterTrackerFactory {
    /**
     * The method 'createDebugAdapterTracker' is called at the start of a debug
     * session in order to return a "tracker" object that provides read-access
     * to the communication between VS Code and a debug adapter.
     *
     * @param session The [debug session](#DebugSession) for which the debug
     * adapter tracker will be used.
     * @return A [debug adapter tracker](#DebugAdapterTracker) or undefined.
     */
    createDebugAdapterTracker(session: vscode.DebugSession): vscode.ProviderResult<vscode.DebugAdapterTracker> {
        return new DapstarDebugAdapterTracker();
    }
}

class DapstarDebugAdapterTracker implements vscode.DebugAdapterTracker {
    /**
     * A session with the debug adapter is about to be started.
     */
    onWillStartSession?(): void {
        console.info('onWillStartSession');
    }

    /**
     * The debug adapter is about to receive a Debug Adapter Protocol
     * message from VS Code.
     */
    onWillReceiveMessage?(message: any): void {
        console.info(`onWillReceiveMessage\n${JSON.stringify(message, null, 2)}`);
    }

    /**
     * The debug adapter has sent a Debug Adapter Protocol message to VS
     * Code.
     */
    onDidSendMessage?(message: any): void {
        console.info(`onDidSendMessage\n${JSON.stringify(message, null, 2)}`);
    }

    /**
     * The debug adapter session is about to be stopped.
     */
    onWillStopSession?(): void {
        console.info('onWillStopSession');
    }

    /**
     * An error with the debug adapter has occurred.
     */
    onError?(error: Error): void {
        console.info('onError', error);
    }

    /**
     * The debug adapter has exited with the given exit code or signal.
     */
    onExit?(code: number | undefined, signal: string | undefined): void {
        console.info('onExit', code, signal);
    }
}
