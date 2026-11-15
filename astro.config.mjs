// @ts-check
import { defineConfig } from 'astro/config';

// Oldest browsers the site supports. Lightning CSS adds vendor prefixes and
// lowers newer CSS syntax for these; esbuild does the same for the JS.
const v = (major) => major << 16;
const targets = { chrome: v(87), edge: v(87), firefox: v(78), safari: v(14), ios_saf: v(14), samsung: v(14) };

// https://astro.build/config
export default defineConfig({
  site: 'https://hex3961.github.io',
  vite: {
    css: {
      transformer: 'lightningcss',
      lightningcss: { targets },
    },
    build: {
      cssMinify: 'lightningcss',
      target: ['chrome87', 'edge87', 'firefox78', 'safari14', 'ios14'],
    },
  },
});
