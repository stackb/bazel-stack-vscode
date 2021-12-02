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
