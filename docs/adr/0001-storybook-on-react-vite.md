# Storybook runs on react-vite though the app is vanilla JS

The screen map (`@zigbang/storybook-addon-story-flow`) only renders stories inside its nodes on React frameworks; on `@storybook/html-vite` every node came up blank. So Storybook uses `@storybook/react-vite`, and each screen story is a small React wrapper that mounts the app's own vanilla render function (`src/screens/*.js`) into a `<div id="app">`. React is a dev dependency for Storybook only; the shipped game does not use it.
