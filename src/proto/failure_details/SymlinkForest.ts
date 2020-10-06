// Original file: proto/failure_details.proto


// Original file: proto/failure_details.proto

export enum _failure_details_SymlinkForest_Code {
  SYMLINK_FOREST_UNKNOWN = 0,
  TOPLEVEL_OUTDIR_PACKAGE_PATH_CONFLICT = 1,
  TOPLEVEL_OUTDIR_USED_AS_SOURCE = 2,
}

export interface SymlinkForest {
  'code'?: (_failure_details_SymlinkForest_Code | keyof typeof _failure_details_SymlinkForest_Code);
}

export interface SymlinkForest__Output {
  'code': (_failure_details_SymlinkForest_Code);
}
