import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';

export interface Closeable {
  close(): void;
}

export class GRPCClient implements vscode.Disposable {
  protected disposables: vscode.Disposable[] = [];
  private closeables: Closeable[] = [];

  constructor(
    protected onError: (err: grpc.ServiceError) => void,
    protected defaultDeadlineSeconds = 30
  ) {}

  protected getDeadline(seconds?: number): grpc.Deadline {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + (seconds || this.defaultDeadlineSeconds));
    return deadline;
  }

  protected handleError(err: grpc.ServiceError): grpc.ServiceError {
    this.onError(err);
    return err;
  }

  protected addCloseable<T extends Closeable>(client: T): T {
    this.closeables.push(client);
    return client;
  }

  public dispose() {
    for (const closeable of this.closeables) {
      closeable.close();
    }
    this.closeables.length = 0;
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
