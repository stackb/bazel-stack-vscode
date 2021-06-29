import * as vscode from 'vscode';
import { BzlClient } from './bzl';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

/**
 * Base class for a view that interacts with a gRPC endpoint and produces tree
 * output.  All such views have a refresh command.
 */
export abstract class BzlClientTreeDataProvider<T> extends GrpcTreeDataProvider<T> {
  public client: BzlClient | undefined;

  constructor(protected name: string, onDidChangeBzlClient: vscode.Event<BzlClient>) {
    super(name);
    onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
  }

  handleBzlClientChange(bzlClient: BzlClient) {
    this.client = bzlClient;
    if (bzlClient) {
      this.clear();
    }
  }

  clear() {
    this.refresh();
  }
}
