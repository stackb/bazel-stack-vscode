// Original file: proto/failure_details.proto


// Original file: proto/failure_details.proto

export enum _failure_details_ExternalRepository_Code {
  EXTERNAL_REPOSITORY_UNKNOWN = 0,
  OVERRIDE_DISALLOWED_MANAGED_DIRECTORIES = 1,
}

export interface ExternalRepository {
  'code'?: (_failure_details_ExternalRepository_Code | keyof typeof _failure_details_ExternalRepository_Code);
}

export interface ExternalRepository__Output {
  'code': (_failure_details_ExternalRepository_Code);
}
