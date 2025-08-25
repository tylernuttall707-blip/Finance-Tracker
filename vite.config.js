import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  // Use relative paths so built assets work on GitHub Pages and other
  // subdirectory deployments instead of assuming the site is served from
  // the domain root.
  base: './',
});
