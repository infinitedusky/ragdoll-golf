/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../stories/**/*.stories.@(js|jsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-vitest',
    {
      name: '@zigbang/storybook-addon-story-flow',
      options: { flowGlob: '../stories/**/*.flow.json' },
    },
  ],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
}

export default config
