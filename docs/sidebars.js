module.exports = {
  docs: [
    {
      type: 'category',
      label: 'bazel-stack-vscode',
      collapsed: false,
      items: [
        'vscode/installation',
        'vscode/authentication',
        'vscode/buildifier',
        'vscode/buildozer',
        'vscode/debugger',
        'vscode/starlark-language-server',
        'vscode/remote-cache',
        'vscode/bazel',
        'vscode/subscription',
        'vscode/ui',
        'vscode/codesearch',
        'vscode/build-events',
        'vscode/invocations',
      ],
    },
    {
      type: 'category',
      label: 'CLI',
      collapsed: false,
      items: ['configuration/overview', 'configuration/oauth_provider', 'configuration/session_storage', 'configuration/tls', 'configuration/alpha-config'],
    },
  ],
};
