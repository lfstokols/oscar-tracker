import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
//import vue from '@vitejs/plugin-vue';
// import {config} from 'dotenv';

// config();

export default defineConfig(({command, mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BUILD_BASE_URL || '/',
    plugins: [react()],
    server: {
      port: env.VITE_PORT,
      proxy: {
        [env.VITE_BUILD_BASE_URL + '/api']: {
          target: `http://127.0.0.1:${env.DEVSERVER_PORT}`,
          changeOrigin: true,
        },
      },
    },
  };
});
