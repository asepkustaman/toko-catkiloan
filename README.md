# PaintStore

Kasir dan manajemen stok berbasis React, Vite, dan Supabase.

## Menjalankan aplikasi

1. Buat proyek Supabase, lalu jalankan [`supabase/schema.sql`](./supabase/schema.sql) di **SQL Editor**.
2. Salin `.env.example` menjadi `.env.local`, kemudian isi URL proyek dan publishable/anon key Supabase. Jangan pernah memasukkan `service_role` key ke aplikasi browser.
3. Jalankan:

   ```sh
   npm install
   npm run dev
   ```

4. Buat akun pengguna melalui **Supabase Authentication > Users**. Trigger database akan membuat toko, pengaturan awal, dan kategori standar; nama toko awalnya `Toko Baru` dan dapat diubah dari pengaturan aplikasi.
5. Untuk menguji hasil produksi: `npm run build`, lalu `npm run preview`.

Atur verifikasi email dan redirect URL di **Supabase Authentication > URL Configuration** sesuai alamat aplikasi. Halaman masuk hanya menerima akun yang sudah dibuat di Supabase; tidak ada pendaftaran dari aplikasi. Setiap akun baru akan membuat satu toko; data tiap toko dilindungi Row Level Security (RLS). Penjualan dan penerimaan stok dicatat melalui RPC transaksional agar pembaruan persediaan dan riwayatnya konsisten.

## Deploy ke GitHub Pages

Workflow `.github/workflows/deploy.yml` membangun dan menerbitkan aplikasi ke `https://asepkustaman.github.io/toko-catkiloan/` setiap kali ada push ke branch `main`.

1. Di repositori GitHub, buka **Settings > Secrets and variables > Actions > New repository secret**.
2. Tambahkan `VITE_SUPABASE_URL` berisi URL proyek Supabase dan `VITE_SUPABASE_ANON_KEY` berisi publishable/anon key. Jangan gunakan `service_role` atau secret key.
3. Buka **Settings > Pages**, pilih **GitHub Actions** sebagai build and deployment source.
4. Push branch `main`; pantau prosesnya di tab **Actions**. Workflow sengaja menghentikan build jika salah satu secret belum diisi.
5. Tambahkan URL `https://asepkustaman.github.io/toko-catkiloan/` pada **Supabase Authentication > URL Configuration** sebagai Site URL atau redirect URL yang diizinkan.

URL dan key publishable/anon akan masuk ke bundle browser saat build; itu memang konfigurasi klien Supabase. Keamanannya harus ditegakkan dengan RLS di `supabase/schema.sql`. Jangan pernah membagikan service-role key ke browser atau GitHub Actions variable publik.

## Skema database

Skema membuat tabel `stores`, `store_members`, `store_settings`, `categories`, `vendors`, `products`, `sales`, `sale_items`, `stock_entries`, dan `inventory_movements`. Fungsi `checkout_sale` menyimpan transaksi, snapshot harga pokok, dan pengurangan stok dalam satu transaksi database. Nomor transaksi menggunakan format `S-YYMMDD-001`, dengan nomor urut harian per toko. Fungsi `record_stock_entry` mencatat pembelian dan menambah stok secara atomik. Untuk proyek Supabase yang sudah aktif, jalankan [`supabase/migrations/20261115_transaction_code_format.sql`](./supabase/migrations/20261115_transaction_code_format.sql) di **SQL Editor** agar format nomor transaksi yang baru berlaku.

## Data aplikasi lama

Versi sebelumnya menyimpan data dalam satu dokumen `store_data` dan cache browser `paintStoreData`. Skema baru menggunakan tabel relasional dan akun toko, jadi data lama tidak dipindahkan otomatis. Ekspor/cadangkan data lama terlebih dahulu sebelum berhenti menggunakan versi sebelumnya.
