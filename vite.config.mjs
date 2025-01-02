import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
//import vue from '@vitejs/plugin-vue';
import { config } from 'dotenv';

config();

export default defineConfig({
	plugins: [react()],
	//plugins: [react(), vue()],
	base: '/oscars/',
	server: {
		port: process.env.VITE_PORT,
		proxy: {
			'/api': {
				target: `http://127.0.0.1:${process.env.DEVSERVER_PORT}/oscars`,
				changeOrigin: true
			}
		}
	}
});