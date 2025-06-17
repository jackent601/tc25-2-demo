// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import path from 'path'

// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       // cesium: 'cesium/Source'
//       cesium: path.resolve(__dirname, 'node_modules/cesium/Source')
//     }
//   },
//   define: {
//     // CESIUM_BASE_URL: JSON.stringify('node_modules/cesium/Source')
//     CESIUM_BASE_URL: JSON.stringify('/cesium')
//   },
//   server: {
//     port: 5173,
//   },
//   build: {
//     rollupOptions: {
//       output: {
//         // Needed for Cesium static assets loading
//         assetFileNames: 'assets/[name].[hash].[ext]',
//         chunkFileNames: 'assets/[name].[hash].js',
//         entryFileNames: 'assets/[name].[hash].js',
//       }
//     }
//   }
// })


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    // Tell Cesium where to find its static assets at runtime
    CESIUM_BASE_URL: JSON.stringify('/Cesium')
  }
});

