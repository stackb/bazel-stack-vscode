import * as grpc from '@grpc/grpc-js';
import * as vscode from 'vscode';
import { AuthServiceClient } from '../../../proto/build/stack/auth/v1beta1/AuthService';
import { LoginResponse } from '../../../proto/build/stack/auth/v1beta1/LoginResponse';
import { PasswordResetResponse } from '../../../proto/build/stack/auth/v1beta1/PasswordResetResponse';

export class EmailAuthFlow implements vscode.Disposable {
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

  /**
   * Register with username/password.  Resolves to a jwt token that can be used
   * in auth bearer token calls.
   * @param name
   * @param email
   * @param password
   */
  public async register(name: string, email: string, password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.authClient.Register(
        {
          name: name,
          email: email,
          password: password,
          sendConfirmationEmail: true,
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

  /**
   * resetPassword with email.
   * @param email
   */
  public async resetPassword(email: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.authClient.passwordReset(
        {
          email: email,
        },
        new grpc.Metadata(),
        (err?: grpc.ServiceError, resp?: PasswordResetResponse) => {
          if (err) {
            reject(`${err.code}: ${err.message} (${err.details})`);
            return;
          }
          resolve();
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
