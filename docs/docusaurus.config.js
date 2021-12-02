module.exports = {
  title: 'bazel-stack-vscode',
  tagline: 'Bazel developer productivity suite',
  url: 'https://bzl.io',
  baseUrl: '/bzl/',
  onBrokenLinks: 'throw',
  favicon: 'https://stackb.github.io/bazel-stack-vscode/logos/stack-build.png',
  organizationName: 'stackb', // Usually your GitHub org/user name.
  projectName: 'bazel-stack-vscode', // Usually your repo name.
  themeConfig: {
    defaultMode: 'dark',
    navbar: {
      title: 'docs.bzl.io',
      logo: {
        alt: 'docs.bzl.io',
        src: 'https://stackb.github.io/bazel-stack-vscode/logos/stack-build.png',
      },
      items: [
        {
          to: 'docs/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
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
