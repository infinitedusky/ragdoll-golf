import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

const dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  // React is CommonJS; pre-bundle it so the browser run gets its default exports.
  optimizeDeps: {
    include: ['react', 'react/jsx-dev-runtime', 'react-dom', 'react-dom/client'],
  },
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: `${dirname}.storybook` })],
        test: {
          name: 'storybook',
          exclude: ['**/node_modules/**', '**/*.flow.json'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
})
