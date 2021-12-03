module.exports = {
  title: 'bazel-stack-vscode',
  tagline: 'Bazel developer productivity suite',
  url: 'https://docs.stack.build',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  favicon: 'https://stackb.github.io/bazel-stack-vscode/logos/stack-build.png',
  organizationName: 'stackb', // Usually your GitHub org/user name.
  projectName: 'stack.build', // Usually your repo name.
  themeConfig: {
    defaultMode: 'light',
    navbar: {
      title: 'Home',
      logo: {
        alt: 'Documentation',
        src: 'https://stackb.github.io/bazel-stack-vscode/logos/stack-build.png',
      },
      items: [
        {
          to: 'docs/vscode/installation',
          activeBasePath: 'docs',
          label: 'Bazel-Stack-VSCode',
          position: 'left',
        },
        {
          to: 'docs/cli/installation',
          activeBasePath: 'docs',
          label: 'Bzl CLI',
          position: 'left',
        },
        {
          to: 'docs/remote-cache/overview',
          activeBasePath: 'docs',
          label: 'Bzl Remote Cache',
          position: 'left',
        },
        {
          to: 'docs/ui/overview',
          activeBasePath: 'docs',
          label: 'Bezel UI',
          position: 'left',
        },
        {
          to: 'docs/invocations/overview',
          activeBasePath: 'docs',
          label: 'Build Results UI',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://bzl.io',
          label: 'BZL.IO',
          position: 'right',
        },
        {
          href: 'https://github.com/stackb/bazel-stack-vscode',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Stack.Build LLC.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          editUrl:
            'https://github.com/stackb/bazel-stack-vscode/edit/master/docs/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
