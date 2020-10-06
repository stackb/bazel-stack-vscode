// Original file: proto/failure_details.proto


// Original file: proto/failure_details.proto

export enum _failure_details_ClientEnvironment_Code {
  CLIENT_ENVIRONMENT_UNKNOWN = 0,
  CLIENT_CWD_MALFORMED = 1,
}

export interface ClientEnvironment {
  'code'?: (_failure_details_ClientEnvironment_Code | keyof typeof _failure_details_ClientEnvironment_Code);
}

export interface ClientEnvironment__Output {
  'code': (_failure_details_ClientEnvironment_Code);
}
