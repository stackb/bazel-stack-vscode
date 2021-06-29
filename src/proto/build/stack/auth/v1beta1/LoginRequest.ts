// Original file: proto/auth.proto

export interface LoginRequest {
  /**
   * a jwt token
   */
  token?: string;
  /**
   * alternatively, one can use a username & password
   */
  username?: string;
  password?: string;
  /**
   * 2nd alternative is to specify only github username; it will trigger oauth
   * flow and Login() will return only when completed.
   */
  githubUsername?: string;
}

export interface LoginRequest__Output {
  /**
   * a jwt token
   */
  token: string;
  /**
   * alternatively, one can use a username & password
   */
  username: string;
  password: string;
  /**
   * 2nd alternative is to specify only github username; it will trigger oauth
   * flow and Login() will return only when completed.
   */
  githubUsername: string;
}
