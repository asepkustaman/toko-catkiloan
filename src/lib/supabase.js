import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const AUTH_REQUEST_TIMEOUT = 15000;

const fetchWithAuthTimeout = async (input, init = {}) => {
  const requestUrl = typeof input === 'string' ? input : input.url ?? '';
  if (!requestUrl.includes('/auth/v1/token')) return fetch(input, init);

  const controller = new AbortController();
  const requestSignal = init.signal;
  let timedOut = false;
  const abortFromRequest = () => controller.abort();
  if (requestSignal?.aborted) abortFromRequest();
  else requestSignal?.addEventListener('abort', abortFromRequest, { once: true });

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, AUTH_REQUEST_TIMEOUT);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) {
      throw new Error('Permintaan masuk ke Supabase terlalu lama. Periksa koneksi internet dan URL Supabase, lalu coba lagi.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
    requestSignal?.removeEventListener('abort', abortFromRequest);
  }
};

export const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, { global: { fetch: fetchWithAuthTimeout } })
  : null;

export const supabaseSetupError =
  'Konfigurasi Supabase belum tersedia. Salin .env.example menjadi .env.local, lalu isi URL proyek dan publishable/anon key.';
