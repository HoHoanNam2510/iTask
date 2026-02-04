import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
  // 👇 Cấu hình Build để sửa lỗi Chunk Size Warning
  build: {
    chunkSizeWarningLimit: 1600, // Tăng giới hạn lên 1600kB
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Tách các thư viện lớn ra khỏi file chính
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
