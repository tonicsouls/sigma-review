import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/sigma-review/',
  server: {
    fs: {
      // Allow serving files from SIGMA v3 and DRAFT CONTENT
      allow: [
        'C:/Users/Darry/OneDrive/Brain Candy portal OMBU/ROOT_BODY_X/Organs_apps/VSCodeWorkingDocs/COS-CE-2026_0106/externaldata/proposal',
      ],
    },
  },
});
