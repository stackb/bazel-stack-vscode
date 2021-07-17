// Original file: proto/livegrep.proto

export interface Query {
  line?: string;
  file?: string;
  repo?: string;
  tags?: string;
  foldCase?: boolean;
  notFile?: string;
  notRepo?: string;
  notTags?: string;
  maxMatches?: number;
  filenameOnly?: boolean;
  contextLines?: number;
}

export interface Query__Output {
  line: string;
  file: string;
  repo: string;
  tags: string;
  foldCase: boolean;
  notFile: string;
  notRepo: string;
  notTags: string;
  maxMatches: number;
  filenameOnly: boolean;
  contextLines: number;
}
