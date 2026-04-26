// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
	base: './', // Ensures relative paths for Apache hosting
	build: {
		outDir: 'dist',
		emptyOutDir: true
	}
});
