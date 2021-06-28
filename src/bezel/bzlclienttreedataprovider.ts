import * as vscode from 'vscode';
import { BzlClient } from './bzl';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

/**
 * Base class for a view that interacts with a gRPC endpoint and produces tree
 * output.  All such views have a refresh command.
 */
export abstract class BzlClientTreeDataProvider<T> extends GrpcTreeDataProvider<T> {
  protected bzlClient: BzlClient | undefined;

  constructor(protected name: string, onDidChangeBzlClient: vscode.Event<BzlClient | undefined>) {
    super(name);
    onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
  }

  handleBzlClientChange(bzlClient: BzlClient | undefined) {
    this.bzlClient = bzlClient;
    if (bzlClient) {
      this.clear();
    }
  }

  clear() {
    this.refresh();
  }
}
