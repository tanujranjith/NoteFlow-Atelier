import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    open: '/HomePage.html'
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        home: resolve(__dirname, 'HomePage.html'),
        atelier: resolve(__dirname, 'NoteflowAtelier.html'),
        homework: resolve(__dirname, 'Homework.html'),
        classic: resolve(__dirname, 'NoteFlow (classic)/NoteFlow.html')
      }
    }
  }
});
