import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/pawlands-cat-colony-idle-game/',
  plugins: [react()],
});
