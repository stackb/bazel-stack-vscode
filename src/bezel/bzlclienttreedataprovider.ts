import * as vscode from 'vscode';
import { BzlClient } from './bzl';
import { GrpcTreeDataProvider } from './grpctreedataprovider';

/**
 * Base class for a view that interacts with a gRPC endpoint and produces tree
 * output.  All such views have a refresh command.
 */
export abstract class BzlClientTreeDataProvider<T> extends GrpcTreeDataProvider<T> {
  protected client: BzlClient | undefined;

  constructor(protected name: string, onDidChangeBzlClient: vscode.Event<BzlClient>) {
    super(name);
    onDidChangeBzlClient(this.handleBzlClientChange, this, this.disposables);
  }

  handleBzlClientChange(client: BzlClient) {
    this.client = client;
    this.clear();
  }

  clear() {
    this.refresh();
  }
}
