// Original file: proto/failure_details.proto


// Original file: proto/failure_details.proto

export enum _failure_details_PackageOptions_Code {
  PACKAGE_OPTIONS_UNKNOWN = 0,
  PACKAGE_PATH_INVALID = 1,
}

export interface PackageOptions {
  'code'?: (_failure_details_PackageOptions_Code | keyof typeof _failure_details_PackageOptions_Code);
}

export interface PackageOptions__Output {
  'code': (_failure_details_PackageOptions_Code);
}
