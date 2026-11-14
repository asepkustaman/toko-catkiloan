import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const supabaseSetupError =
  'Konfigurasi Supabase belum tersedia. Salin .env.example menjadi .env.local, lalu isi URL proyek dan publishable/anon key.';
