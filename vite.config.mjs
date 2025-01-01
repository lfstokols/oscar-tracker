import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [react(), vue()],
  base: '/oscars/',
  server: {
    port: 8000,
	proxy: {
		'/api': {
			target: 'http://127.0.0.1:3080/oscars',
			changeOrigin: true
		}
	}
  }
});