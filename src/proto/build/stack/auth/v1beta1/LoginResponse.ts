// Original file: proto/auth.proto

import type {
  User as _build_stack_auth_v1beta1_User,
  User__Output as _build_stack_auth_v1beta1_User__Output,
} from '../../../../build/stack/auth/v1beta1/User';

export interface LoginResponse {
  /**
   * the user details
   */
  user?: _build_stack_auth_v1beta1_User | null;
  /**
   * a jwt token that can be used for subsequent auth
   */
  token?: string;
}

export interface LoginResponse__Output {
  /**
   * the user details
   */
  user: _build_stack_auth_v1beta1_User__Output | null;
  /**
   * a jwt token that can be used for subsequent auth
   */
  token: string;
}
