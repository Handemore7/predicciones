import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Para GitHub Pages es conveniente fijar base al nombre del repo.
// Si despliegas en Netlify / dominio raíz puedes sobreescribir con BASE env.
const base = process.env.VITE_BASE || '/predicciones/';

export default defineConfig({
  base,
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});

