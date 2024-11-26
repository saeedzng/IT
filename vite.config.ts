import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('Vite Config:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_API_KEY:', process.env.VITE_SUPABASE_API_KEY);

export default defineConfig({
  plugins: [react()],
  base: '/IT/',
});
