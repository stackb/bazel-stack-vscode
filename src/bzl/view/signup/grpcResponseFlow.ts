import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';

export abstract class GRPCResponseFlow<T> {
  constructor(protected name: string, protected bearerToken: string) {}

  getGrpcMetadata(): grpc.Metadata {
    const md = new grpc.Metadata();
    md.add('Authorization', `Bearer ${this.bearerToken}`);
    return md;
  }

  async get(): Promise<T> {
    const result = await this.getInternal();
    if (result.error) {
      this.handleServiceError(result.error);
      throw result.error;
    }
    return this.handleResponse(result.response!);
  }

  abstract getInternal(): Promise<{
    response: T | undefined;
    error: grpc.ServiceError | undefined;
  }>;

  async handleServiceError(status: grpc.ServiceError): Promise<void> {
    vscode.window.showErrorMessage(
      `${this.name} service error: ${status.message} (${status.code})`
    );
    return Promise.reject(status.code);
  }

  async handleResponse(response: T): Promise<T> {
    return response;
  }
}
