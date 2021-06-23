// Original file: proto/auth.proto

export interface RegisterRequest {
  name?: string;
  email?: string;
  password?: string;
  sendConfirmationEmail?: boolean;
}

export interface RegisterRequest__Output {
  name: string;
  email: string;
  password: string;
  sendConfirmationEmail: boolean;
}
