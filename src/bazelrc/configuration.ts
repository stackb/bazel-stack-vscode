/**
 * Returns true if the argument is a valid bazel command name.
 *
 * @param token the token to check
 */
export function isBazelCommand(token: string): boolean {
  return BazelCommands.has(token);
}

export const BazelCommands = new Set<string>([
  'analyze-profile',
  'aquery',
  'build',
  'canonicalize-flags',
  'clean',
  'config',
  'coverage',
  'cquery',
  'dump',
  'fetch',
  'help',
  'info',
  'license',
  'mobile-install',
  'print_action',
  'query',
  'run',
  'shutdown',
  'sync',
  'test',
  'version',
]);
