import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { AuthServiceClient } from '../../../proto/build/stack/auth/v1beta1/AuthService';
import { LoginResponse } from '../../../proto/build/stack/auth/v1beta1/LoginResponse';

export class LoginAuthFlow implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor(protected authClient: AuthServiceClient) {}

  /**
   * Login with username/password.  Resolves to a jwt token that can be used
   * in auth bearer token calls.
   * @param username
   * @param password
   */
  public async login(username: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.authClient.Login(
        {
          username: username,
          password: password,
        },
        new grpc.Metadata(),
        (err?: grpc.ServiceError, resp?: LoginResponse) => {
          if (err) {
            reject(`${err.code}: ${err.message} (${err.details})`);
            return;
          }
          resolve(resp?.token);
        }
      );
    });
  }

  public dispose() {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables.length = 0;
  }
}
