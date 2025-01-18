import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
//import vue from '@vitejs/plugin-vue';
import {config} from 'dotenv';

config();

export default defineConfig({
  plugins: [react()],
  //plugins: [react(), vue()],
  base: process.env.VITE_BUILD_BASE_URL,
  server: {
    port: process.env.VITE_PORT,
    proxy: {
      [process.env.VITE_BUILD_BASE_URL + '/api']: {
        target: `http://127.0.0.1:${process.env.DEVSERVER_PORT}`,
        changeOrigin: true,
      },
    },
  },
});
