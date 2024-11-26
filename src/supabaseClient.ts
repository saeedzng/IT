import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_API_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase API Key:', supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  throw new Error('supabaseUrl and supabaseKey are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
