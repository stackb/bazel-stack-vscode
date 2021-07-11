// Original file: proto/failure_details.proto


// Original file: proto/failure_details.proto

export enum _failure_details_Interrupted_Code {
  /**
   * Interrupted at an unspecified time.
   */
  INTERRUPTED_UNKNOWN = 0,
}

export interface Interrupted {
  'code'?: (_failure_details_Interrupted_Code | keyof typeof _failure_details_Interrupted_Code);
}

export interface Interrupted__Output {
  'code': (_failure_details_Interrupted_Code);
}
