import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, BarChart3, Boxes, BriefcaseBusiness, Check,
  CircleDollarSign, ClipboardList, CreditCard, LayoutDashboard,
  LogOut, Menu, Package, Pencil, Plus, Search, Settings, ShieldCheck,
  ShoppingCart, Trash2, TrendingUp, Truck, X,
} from './PaintIcons.jsx';
import { supabase, supabaseSetupError } from './lib/supabase.js';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'Kasir', icon: ShoppingCart },
  { id: 'sales', label: 'Penjualan', icon: ClipboardList },
  { id: 'stock', label: 'Stok masuk', icon: ArrowDownToLine },
  { id: 'products', label: 'Produk', icon: Package },
  { id: 'vendors', label: 'Vendor', icon: Truck },
  { id: 'reports', label: 'Laba rugi', icon: TrendingUp },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
const today = () => new Date().toLocaleDateString('en-CA');
const money = (value) => currency.format(Number(value) || 0);
const quantity = (value) => numberFormat.format(Number(value) || 0);
const localDate = (value) => new Date(value).toLocaleDateString('en-CA');
const shortDate = (value) => {
  if (!value) return '-';
  const date = value.length > 10 ? new Date(value) : new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
};
const errorMessage = (error) => error?.message || 'Terjadi kesalahan yang tidak diketahui.';

function App() {
  const [session, setSession] = useState(null);
  const sessionUserId = useRef(null);
  const [authReady, setAuthReady] = useState(false);
  const [authTransitioning, setAuthTransitioning] = useState(false);
  const [authError, setAuthError] = useState('');
  const [store, setStore] = useState(null);
  const [page, setPage] = useState('dashboard');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}service-worker.js`)
      .catch((error) => console.error('[PWA] Gagal mendaftarkan service worker:', error));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setAuthError(supabaseSetupError);
      setAuthReady(true);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setAuthError(error.message);
      const currentSession = data?.session ?? null;
      sessionUserId.current = currentSession?.user?.id ?? null;
      setSession(currentSession);
      setAuthReady(true);
    }).catch((error) => {
      if (!active) return;
      setAuthError(errorMessage(error));
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;
      const identityChanged = sessionUserId.current !== nextUserId;
      sessionUserId.current = nextUserId;
      setSession(nextSession);
      if (identityChanged) {
        setStore(null);
        setAuthError('');
        setSidebarExpanded(false);
        setMobileMenu(false);
      }
      if (event === 'SIGNED_IN' && nextUserId && identityChanged) {
        setPage('dashboard');
        setMobileMenu(false);
        setAuthTransitioning(true);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authTransitioning) return undefined;
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 700 : 1900;
    const timeout = window.setTimeout(() => setAuthTransitioning(false), duration);
    return () => window.clearTimeout(timeout);
  }, [authTransitioning]);

  useEffect(() => {
    if (!session?.user?.id) return;
    let active = true;
    supabase
      .from('store_members')
      .select('store_id, role, store:stores(id, name)')
      .eq('user_id', session.user.id)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAuthError(`Gagal memuat toko: ${error.message}`);
          return;
        }
        if (!data?.store) {
          setAuthError('Akun ini belum terhubung ke toko. Hubungi administrator toko.');
          return;
        }
        setStore({ ...data.store, role: data.role });
        setAuthError('');
      })
      .catch((error) => {
        if (active) setAuthError(`Gagal memuat toko: ${errorMessage(error)}`);
      });
    return () => { active = false; };
  }, [session]);

  const loadData = useCallback(async (showIndicator = true) => {
    if (!store?.id) return;
    if (showIndicator) setLoading(true);
    let results;
    try {
      results = await Promise.all([
        supabase.from('products')
          .select('*, category:categories(id, name), vendor:vendors(id, name)')
          .eq('store_id', store.id).order('name'),
        supabase.from('categories').select('id, name').eq('store_id', store.id).order('name'),
        supabase.from('vendors').select('*').eq('store_id', store.id).order('name'),
        supabase.from('sales')
          .select('*, sale_items(*)')
          .eq('store_id', store.id).order('created_at', { ascending: false }).limit(1000),
        supabase.from('stock_entries')
          .select('*, product:products(name), vendor:vendors(name)')
          .eq('store_id', store.id).order('occurred_on', { ascending: false }).limit(500),
        supabase.from('store_settings').select('*').eq('store_id', store.id).single(),
      ]);
    } finally {
      if (showIndicator) setLoading(false);
    }
    const failed = results.find((result) => result.error);
    if (failed) throw failed.error;
    setProducts(results[0].data ?? []);
    setCategories(results[1].data ?? []);
    setVendors(results[2].data ?? []);
    setSales(results[3].data ?? []);
    setStockEntries(results[4].data ?? []);
    setSettings(results[5].data ?? null);
  }, [store]);

  useEffect(() => {
    if (!store) return;
    loadData(false).catch((error) => setNotice({ type: 'error', text: `Gagal memuat data: ${errorMessage(error)}` }));
  }, [store, loadData]);

  const run = async (action, successText) => {
    try {
      await action();
      if (successText) setNotice({ type: 'success', text: successText });
      await loadData();
    } catch (error) {
      setNotice({ type: 'error', text: errorMessage(error) });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setNotice({ type: 'error', text: `Gagal keluar: ${errorMessage(error)}` });
    }
  };

  const canManage = store?.role === 'owner' || store?.role === 'manager';
  const permittedNavItems = canManage
    ? navItems
    : navItems.filter((item) => ['dashboard', 'pos', 'sales'].includes(item.id));
  const navigate = (nextPage) => {
    if (!canManage && !['dashboard', 'pos', 'sales'].includes(nextPage)) {
      setNotice({ type: 'error', text: 'Akses ini hanya tersedia untuk pemilik atau pengelola toko.' });
      return;
    }
    setPage(nextPage);
  };
  if (!authReady) return <LoadingScreen />;
  if (!session || authTransitioning) {
    return <AuthScreen setupError={supabase ? '' : authError} transitioning={authTransitioning} />;
  }
  if (!store) {
    return authError
      ? <AuthScreen setupError={authError} signedInEmail={session.user.email} onSignOut={signOut} />
      : <LoadingScreen />;
  }

  const activeNav = navItems.find((item) => item.id === page);
  return (
    <div className={`app-shell ${page === 'pos' ? 'app-pos-shell' : ''} ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}>
      {mobileMenu && <button className="mobile-scrim" onClick={() => setMobileMenu(false)} aria-label="Tutup menu" />}
      <aside
        className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') setSidebarExpanded(true);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') {
            setSidebarExpanded(false);
            setMobileMenu(false);
          }
        }}
        onFocusCapture={() => setSidebarExpanded(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setSidebarExpanded(false);
        }}
      >
        <div className="sidebar-header"><Brand /></div>
        <p className="nav-caption">MENU UTAMA</p>
        <nav className="nav-list">
          {permittedNavItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} aria-label={label} onClick={() => navigate(id)}>
              <Icon size={18} strokeWidth={1.8} /><span>{label}</span>
              {id === 'products' && products.some((product) => Number(product.stock) <= Number(settings?.low_stock_threshold ?? 5)) && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-note" title="Data tersimpan aman dengan Supabase" aria-label="Data tersimpan aman dengan Supabase"><ShieldCheck size={16} /><span>Data tersimpan aman<br />dengan Supabase</span></div>
          <button className="profile-button" onClick={signOut} aria-label={`Keluar dari akun ${session.user.email}`} title={`Keluar dari akun ${session.user.email}`}><span className="profile-avatar">{session.user.email?.slice(0, 1).toUpperCase()}</span><span className="profile-copy"><strong>{session.user.email}</strong><small>{store.role === 'owner' ? 'Pemilik toko' : 'Anggota toko'}</small></span><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu-button" onClick={() => setMobileMenu(true)} aria-label="Buka menu"><Menu size={21} /></button>
          <div className="breadcrumb">Toko / <strong>{activeNav?.label}</strong></div>
          <div className="topbar-right"><span className="live-dot" /> Data tersinkron <span className="topbar-date">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}</span></div>
        </header>
        {notice && <div className={`toast toast-${notice.type}`} role="status">{notice.type === 'success' ? <Check size={17} /> : <X size={17} />}{notice.text}<button onClick={() => setNotice(null)} aria-label="Tutup"><X size={15} /></button></div>}
        <div className={`content ${page === 'dashboard' ? 'dashboard-content' : ''}`}>
          {loading && <div className="sync-indicator">Memperbarui data...</div>}
          {page === 'dashboard' && <Dashboard store={store} products={products} sales={sales} stockEntries={stockEntries} settings={settings} setPage={navigate} />}
          {page === 'pos' && <PointOfSale products={products} storeId={store.id} run={run} />}
          {page === 'sales' && <SalesPage sales={sales} />}
          {page === 'stock' && <StockPage products={products} vendors={vendors} stockEntries={stockEntries} storeId={store.id} run={run} />}
          {page === 'products' && <ProductsPage products={products} categories={categories} vendors={vendors} storeId={store.id} run={run} threshold={settings?.low_stock_threshold ?? 5} />}
          {page === 'vendors' && <VendorsPage vendors={vendors} storeId={store.id} run={run} />}
          {page === 'reports' && <ReportsPage sales={sales} stockEntries={stockEntries} />}
          {page === 'settings' && <SettingsPage store={store} settings={settings} storeId={store.id} run={run} onStoreUpdated={(updatedStore) => setStore((current) => ({ ...current, ...updatedStore }))} />}
          {!canManage && ['stock', 'products', 'vendors', 'reports', 'settings'].includes(page) && <EmptyState icon={ShieldCheck} title="Akses terbatas" text="Halaman ini hanya tersedia untuk pemilik atau pengelola toko." />}
        </div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return <div className="full-screen" role="status" aria-label="Memuat aplikasi"><span className="spinner" /></div>;
}

function AuthScreen({ setupError = '', signedInEmail = '', onSignOut, transitioning = false }) {
  const [email, setEmail] = useState(signedInEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (signInError) throw signInError;
    } catch (submitError) {
      setError(errorMessage(submitError));
    } finally {
      setBusy(false);
    }
  };

  if (signedInEmail) {
    return <div className="auth-page"><div className="auth-standalone"><Brand /><div className="auth-message error-message">{setupError}</div><button className="button button-secondary full-button" onClick={onSignOut}><LogOut size={16} /> Keluar dari akun</button></div></div>;
  }

  return (
    <div className="auth-page">
      <div className={`auth-shell ${transitioning ? 'auth-success' : ''}`}>
        <section className="auth-form-panel auth-login" aria-hidden={transitioning} inert={transitioning}>
          <div className="auth-form-inner">
            <div className="auth-heading"><p className="eyebrow">RUANG KERJA PAINT STORE</p><h1>Selamat datang kembali</h1><p>Masuk untuk mengelola penjualan dan stok toko Anda.</p></div>
            {setupError && <div className="auth-message error-message">{setupError}</div>}
            {error && <div className="auth-message error-message" role="alert">{error}</div>}
            <form className="form-stack" onSubmit={submit}>
              <Field label="Email"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nama@email.com" required /></Field>
              <Field label="Kata sandi"><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} placeholder="Minimal 6 karakter" required /></Field>
              <button className="button button-primary full-button" disabled={busy || Boolean(setupError)}>{busy ? 'Memproses...' : 'Masuk ke aplikasi'}<ArrowRight size={17} /></button>
            </form>
            <p className="auth-security"><ShieldCheck size={15} /> Akses data dilindungi autentikasi dan kebijakan RLS.</p>
          </div>
        </section>

        <div className="auth-flow-panel" aria-live="polite">
          <img className="auth-flow-logo" src={`${import.meta.env.BASE_URL}paint-store-logo.png`} alt="Logo Paint Store" />
          <p className="auth-flow-caption">{transitioning ? 'Akses terverifikasi' : 'Sistem kasir & inventaris'}</p>
          <div className="auth-flow-prompt">
            <p>{transitioning ? 'Menyiapkan dashboard Anda.' : 'Penjualan dan stok tercatat rapi dalam satu ruang kerja.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Brand() {
  return <div className="brand"><img className="brand-logo" src={`${import.meta.env.BASE_URL}paint-store-logo.png`} alt="Paint Store" /></div>;
}

function PageHeading({ eyebrow, title, description, action }) {
  return <div className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}

function StatCard({ label, value, note, icon: Icon, tone = 'gold', artwork = false }) {
  return <article className={`stat-card${artwork ? ' stat-card-art' : ''}`}><div className="stat-top"><span>{label}</span><span className={`stat-icon icon-${tone}${artwork ? ' stat-icon-art' : ''}`}><Icon size={artwork ? 76 : 19} strokeWidth={artwork ? 1.6 : 1.9} /></span></div><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></article>;
}

function Dashboard({ store, products, sales, stockEntries, settings, setPage }) {
  const start = today();
  const todaySales = sales.filter((sale) => sale.created_at && localDate(sale.created_at) === start);
  const revenue = todaySales.reduce((sum, sale) => sum + Number(sale.total), 0);
  const lowStock = products.filter((product) => Number(product.stock) <= Number(settings?.low_stock_threshold ?? 5));
  const recent = sales.slice(0, 5);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toLocaleDateString('en-CA');
    return { key, label: new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date), total: sales.filter((sale) => sale.created_at && localDate(sale.created_at) === key).reduce((sum, sale) => sum + Number(sale.total), 0) };
  });
  const max = Math.max(...week.map((day) => day.total), 1);
  const average = todaySales.length ? revenue / todaySales.length : 0;
  return <>
    <div className="stats-grid">
      <StatCard label="Penjualan hari ini" value={money(revenue)} note={`${todaySales.length} transaksi tercatat`} icon={CircleDollarSign} tone="gold" artwork />
      <StatCard label="Rata-rata transaksi" value={money(average)} note="Nilai rata-rata hari ini" icon={CreditCard} tone="blue" artwork />
      <StatCard label="Jumlah produk" value={numberFormat.format(products.length)} note={`${products.reduce((sum, product) => sum + Number(product.stock), 0).toLocaleString('id-ID')} unit tersedia`} icon={Boxes} tone="green" artwork />
      <StatCard label="Stok menipis" value={numberFormat.format(lowStock.length)} note="Perlu segera diperiksa" icon={Package} tone="red" artwork />
    </div>
    <div className="dashboard-grid">
      <section className="panel chart-panel"><div className="panel-heading"><div><h2>Tren penjualan</h2><p>Omzet 7 hari terakhir</p></div><span className="chart-period"><span className="live-dot" /> Minggu ini</span></div>
        <div className="chart-summary"><strong>{money(week.reduce((sum, day) => sum + day.total, 0))}</strong><span>Total omzet</span></div>
        <div className="bar-chart">{week.map((day) => <div className="bar-column" key={day.key} title={`${day.label}: ${money(day.total)}`}><div className="bar-track"><div className={`bar ${day.key === start ? 'bar-today' : ''}`} style={{ height: `${Math.max((day.total / max) * 100, day.total ? 8 : 2)}%` }} /></div><span>{day.label}</span></div>)}</div>
      </section>
      <section className="panel low-stock-panel"><div className="panel-heading"><div><h2>Perhatian stok</h2><p>Produk di bawah ambang minimum</p></div><button className="text-button" onClick={() => setPage('products')}>Lihat semua <ArrowRight size={15} /></button></div>
        {lowStock.length ? <div className="compact-list">{lowStock.slice(0, 5).map((product) => <div className="compact-row" key={product.id}><span className="product-initial">{product.name.slice(0, 1)}</span><span className="compact-copy"><strong>{product.name}</strong><small>{product.category?.name || 'Tanpa kategori'}</small></span><span className="stock-warning">{quantity(product.stock)} {product.unit}</span></div>)}</div> : <EmptyState icon={Check} title="Stok aman" text="Tidak ada produk yang stoknya menipis." /> }
      </section>
      <section className="panel recent-panel"><div className="panel-heading"><div><h2>Transaksi terbaru</h2><p>Aktivitas penjualan terkini</p></div><button className="text-button" onClick={() => setPage('sales')}>Semua transaksi <ArrowRight size={15} /></button></div>
        {recent.length ? <div className="table-wrap"><table><thead><tr><th>No. transaksi</th><th>Tanggal</th><th>Item</th><th className="align-right">Total</th></tr></thead><tbody>{recent.map((sale) => <tr key={sale.id}><td><strong className="mono">{sale.code}</strong></td><td>{shortDate(sale.created_at)}</td><td>{sale.sale_items?.length ?? 0} produk</td><td className="align-right"><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="Belum ada transaksi" text="Transaksi penjualan akan tampil di sini." /> }
      </section>
      <section className="panel quick-actions"><div className="panel-heading"><div><h2>Aktivitas cepat</h2><p>Akses pekerjaan yang sering dilakukan</p></div></div><div className="quick-action-grid"><QuickAction icon={ShoppingCart} label="Transaksi baru" tone="gold" onClick={() => setPage('pos')} /><QuickAction icon={Plus} label="Tambah produk" tone="blue" onClick={() => setPage('products')} /><QuickAction icon={ArrowDownToLine} label="Catat stok masuk" tone="green" onClick={() => setPage('stock')} /><QuickAction icon={BarChart3} label="Lihat laporan" tone="purple" onClick={() => setPage('reports')} /></div></section>
    </div>
  </>;
}

function QuickAction({ icon: Icon, label, tone, onClick }) {
  return <button className="quick-action" onClick={onClick}><span className={`stat-icon icon-${tone}`}><Icon size={19} /></span><span>{label}</span><ArrowRight size={15} /></button>;
}

function EmptyState({ icon: Icon, title, text }) {
  return <div className="empty-state"><span><Icon size={20} /></span><strong>{title}</strong><p>{text}</p></div>;
}

function Field({ label, children, hint }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function PointOfSale({ products, storeId, run }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState('');
  const [paid, setPaid] = useState('');
  const [busy, setBusy] = useState(false);
  const filtered = products.filter((product) => `${product.name} ${product.barcode ?? ''} ${product.category?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));
  const change = Math.max(0, (Number(paid) || 0) - total);
  const add = (product) => setCart((items) => {
    const existing = items.find((item) => item.product.id === product.id);
    if (existing) return items.map((item) => item.product.id === product.id ? { ...item, qty: Math.min(item.qty + 1, Number(product.stock)) } : item);
    return [...items, { product, qty: 1, price: Number(product.sell_price) }];
  });
  const updateQty = (productId, delta) => setCart((items) => items.map((item) => item.product.id === productId ? { ...item, qty: Math.min(Math.max(item.qty + delta, 1), Number(item.product.stock)) } : item));
  const remove = (productId) => setCart((items) => items.filter((item) => item.product.id !== productId));
  const checkout = async () => {
    if (!cart.length) return;
    setBusy(true);
    try {
      await run(async () => {
        const { error } = await supabase.rpc('checkout_sale', {
          p_store_id: storeId,
          p_items: cart.map((item) => ({ product_id: item.product.id, quantity: item.qty })),
          p_discount: Number(discount) || 0,
          p_amount_paid: Number(paid) || 0,
        });
        if (error) throw error;
      }, 'Transaksi berhasil disimpan.');
      setCart([]);
      setDiscount('');
      setPaid('');
    } catch {
      // The shared action handler displays the Supabase error.
    } finally {
      setBusy(false);
    }
  };
  return <>
    <div className="pos-layout">
      <section className="panel product-picker"><div className="search-field"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama atau barcode produk..." /><kbd>⌘ K</kbd></div>
        <div className="product-grid">{filtered.map((product) => <button className="pos-product" key={product.id} disabled={Number(product.stock) <= 0} onClick={() => add(product)}><span className="product-art"><Package size={23} /></span><span className="pos-product-name">{product.name}</span><span className="pos-product-bottom"><strong>{money(product.sell_price)}</strong><small>{quantity(product.stock)} {product.unit} tersedia</small></span></button>)}</div>
        {!filtered.length && <EmptyState icon={Search} title="Produk tidak ditemukan" text="Coba kata kunci yang berbeda." />}
      </section>
      <section className="panel cart-panel"><div className="cart-heading"><span className="cart-icon"><ShoppingCart size={18} /></span><div><h2>Keranjang</h2><p>{cart.length} jenis produk</p></div><button className="icon-button" disabled={!cart.length} onClick={() => setCart([])} title="Kosongkan keranjang"><Trash2 size={17} /></button></div>
        <div className="cart-items">{cart.map((item) => <div className="cart-row" key={item.product.id}><div className="cart-item-copy"><strong>{item.product.name}</strong><small>{money(item.price)} / {item.product.unit}</small></div><div className="quantity-control"><button onClick={() => updateQty(item.product.id, -1)} aria-label="Kurangi">−</button><span>{quantity(item.qty)}</span><button onClick={() => updateQty(item.product.id, 1)} aria-label="Tambah">+</button></div><strong className="cart-line-total">{money(item.price * item.qty)}</strong><button className="remove-button" onClick={() => remove(item.product.id)} aria-label="Hapus"><X size={15} /></button></div>)}
          {!cart.length && <EmptyState icon={ShoppingCart} title="Keranjang masih kosong" text="Pilih produk dari daftar untuk mulai transaksi." />}
        </div>
        <div className="cart-summary"><div className="summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><Field label="Diskon (Rp)"><input type="number" min="0" max={subtotal} value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0" /></Field><div className="summary-total"><span>Total pembayaran</span><strong>{money(total)}</strong></div><Field label="Uang diterima (Rp)"><input type="number" min="0" value={paid} onChange={(event) => setPaid(event.target.value)} placeholder="Masukkan nominal pembayaran" /></Field><div className="summary-line change-line"><span>Kembalian</span><strong>{money(change)}</strong></div><button className="button button-primary full-button checkout-button" disabled={!cart.length || Number(paid) < total || busy} onClick={checkout}><CreditCard size={17} />{busy ? 'Menyimpan transaksi...' : 'Selesaikan transaksi'}</button></div>
      </section>
    </div>
  </>;
}

function ProductsPage({ products, categories, vendors, storeId, run, threshold }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});
  const filtered = products.filter((product) => `${product.name} ${product.barcode ?? ''} ${product.category?.name ?? ''}`.toLowerCase().includes(search.toLowerCase()));
  const open = (product = null) => {
    setEditing(product);
    setForm(product ? { name: product.name, barcode: product.barcode ?? '', category: product.category?.name ?? '', vendor_id: product.vendor_id ?? '', buy_price: product.buy_price, sell_price: product.sell_price } : { name: '', barcode: '', category: categories[0]?.name ?? '', vendor_id: '', buy_price: '', sell_price: '' });
    setModal(true);
  };
  const save = async (event) => {
    event.preventDefault();
    if (Number(form.sell_price) <= Number(form.buy_price)) return;
    setBusy(true);
    try {
      await run(async () => {
        const categoryName = form.category.trim();
        let category = categories.find((item) => item.name.toLowerCase() === categoryName.toLowerCase());
        if (!category && categoryName) {
          const result = await supabase.from('categories').insert({ store_id: storeId, name: categoryName }).select('id, name').single();
          if (result.error) throw result.error;
          category = result.data;
        }
        const payload = {
          store_id: storeId,
          name: form.name.trim(),
          barcode: form.barcode.trim() || null,
          category_id: category?.id ?? null,
          vendor_id: form.vendor_id || null,
          unit: categoryName.toLowerCase().includes('aksesoris') ? 'pcs' : 'kg',
          buy_price: Number(form.buy_price),
          sell_price: Number(form.sell_price),
        };
        const result = editing
          ? await supabase.from('products').update(payload).eq('id', editing.id).eq('store_id', storeId)
          : await supabase.from('products').insert(payload);
        if (result.error) throw result.error;
      }, editing ? 'Produk berhasil diperbarui.' : 'Produk berhasil ditambahkan.');
      setModal(false);
    } catch {
      // The shared action handler displays the Supabase error.
    } finally {
      setBusy(false);
    }
  };
  const remove = async (product) => {
    if (!window.confirm(`Hapus produk "${product.name}"?`)) return;
    await run(async () => {
      const { error } = await supabase.from('products').delete().eq('id', product.id).eq('store_id', storeId);
      if (error) throw error;
    }, 'Produk berhasil dihapus.');
  };
  return <>
    <PageHeading eyebrow="KATALOG & PERSEDIAAN" title="Produk" description="Kelola katalog, harga, vendor, dan ketersediaan produk." action={<button className="button button-primary" onClick={() => open()}><Plus size={17} /> Tambah produk</button>} />
    <section className="panel data-panel"><div className="panel-toolbar"><div className="search-field compact-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk..." /></div><span className="result-count">{filtered.length} produk</span></div>
      <div className="table-wrap"><table><thead><tr><th>PRODUK</th><th>BARCODE</th><th>KATEGORI</th><th>VENDOR</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th><th /></tr></thead><tbody>
        {filtered.map((product) => <tr key={product.id}><td><div className="table-product"><span className="product-initial">{product.name.slice(0, 1)}</span><strong>{product.name}</strong></div></td><td className="mono">{product.barcode || '-'}</td><td>{product.category?.name || '-'}</td><td>{product.vendor?.name || '-'}</td><td><strong>{money(product.sell_price)}</strong></td><td>{quantity(product.stock)} {product.unit}</td><td><span className={`badge ${Number(product.stock) <= Number(threshold) ? 'badge-warning' : 'badge-success'}`}>{Number(product.stock) <= Number(threshold) ? 'Stok menipis' : 'Tersedia'}</span></td><td><div className="row-actions"><button className="icon-button" onClick={() => open(product)} aria-label="Edit"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(product)} aria-label="Hapus"><Trash2 size={15} /></button></div></td></tr>)}
      </tbody></table>{!filtered.length && <EmptyState icon={Package} title="Belum ada produk" text="Tambahkan produk untuk mulai mencatat persediaan dan penjualan." />}</div>
    </section>
    {modal && <Modal title={editing ? 'Edit produk' : 'Tambah produk'} onClose={() => setModal(false)}><form className="form-stack" onSubmit={save}><Field label="Nama produk"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Cat Tembok Putih" /></Field><div className="form-row"><Field label="Kategori" hint="Kategori baru otomatis dibuat."><input list="category-options" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Pilih atau ketik kategori" /><datalist id="category-options">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist></Field><Field label="Barcode"><input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} placeholder="Opsional" /></Field></div><Field label="Vendor"><select value={form.vendor_id} onChange={(event) => setForm({ ...form, vendor_id: event.target.value })}><option value="">Tanpa vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></Field><div className="form-row"><Field label="Harga beli (Rp)"><input type="number" min="0" required value={form.buy_price} onChange={(event) => setForm({ ...form, buy_price: event.target.value })} /></Field><Field label="Harga jual (Rp)"><input type="number" min="1" required value={form.sell_price} onChange={(event) => setForm({ ...form, sell_price: event.target.value })} /></Field></div>{form.buy_price !== '' && form.sell_price !== '' && Number(form.sell_price) <= Number(form.buy_price) && <p className="inline-error">Harga jual harus lebih tinggi dari harga beli.</p>}<ModalActions onCancel={() => setModal(false)} busy={busy} /></form></Modal>}
  </>;
}

function VendorsPage({ vendors, storeId, run }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);
  const open = (vendor = null) => { setEditing(vendor); setForm(vendor ? { name: vendor.name, contact: vendor.contact ?? '', address: vendor.address ?? '' } : { name: '', contact: '', address: '' }); setModal(true); };
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await run(async () => {
        const payload = { store_id: storeId, name: form.name.trim(), contact: form.contact.trim() || null, address: form.address.trim() || null };
        const result = editing ? await supabase.from('vendors').update(payload).eq('id', editing.id).eq('store_id', storeId) : await supabase.from('vendors').insert(payload);
        if (result.error) throw result.error;
      }, editing ? 'Data vendor diperbarui.' : 'Vendor berhasil ditambahkan.');
      setModal(false);
    } catch {
      // The shared action handler displays the Supabase error.
    } finally { setBusy(false); }
  };
  const remove = async (vendor) => {
    if (!window.confirm(`Hapus vendor "${vendor.name}"?`)) return;
    await run(async () => {
      const { error } = await supabase.from('vendors').delete().eq('id', vendor.id).eq('store_id', storeId);
      if (error) throw error;
    }, 'Vendor berhasil dihapus.');
  };
  return <>
    <PageHeading eyebrow="RELASI BISNIS" title="Vendor" description="Simpan informasi pemasok dan pantau pembelian stok." action={<button className="button button-primary" onClick={() => open()}><Plus size={17} /> Tambah vendor</button>} />
    <section className="panel data-panel"><div className="panel-toolbar"><strong className="panel-toolbar-title">{vendors.length} vendor terdaftar</strong></div><div className="vendor-grid">{vendors.map((vendor) => <article className="vendor-card" key={vendor.id}><div className="vendor-card-top"><span className="vendor-art"><BriefcaseBusiness size={21} /></span><div className="row-actions"><button className="icon-button" onClick={() => open(vendor)} aria-label="Edit"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(vendor)} aria-label="Hapus"><Trash2 size={15} /></button></div></div><h3>{vendor.name}</h3><div className="vendor-detail"><span>Kontak</span><strong>{vendor.contact || 'Belum tersedia'}</strong></div><div className="vendor-detail"><span>Alamat</span><strong>{vendor.address || 'Belum tersedia'}</strong></div><div className="vendor-card-foot"><Truck size={15} /> Mitra pemasok</div></article>)}</div>{!vendors.length && <EmptyState icon={Truck} title="Belum ada vendor" text="Tambahkan vendor untuk menghubungkan pemasok dengan stok masuk." />}</section>
    {modal && <Modal title={editing ? 'Edit vendor' : 'Tambah vendor'} onClose={() => setModal(false)}><form className="form-stack" onSubmit={save}><Field label="Nama vendor"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></Field><Field label="Nomor kontak"><input value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} placeholder="Nomor telepon" /></Field><Field label="Alamat"><textarea rows="3" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Alamat vendor" /></Field><ModalActions onCancel={() => setModal(false)} busy={busy} /></form></Modal>}
  </>;
}

function StockPage({ products, vendors, stockEntries, storeId, run }) {
  const [productId, setProductId] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [date, setDate] = useState(today());
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const selectedProduct = products.find((product) => product.id === productId);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await run(async () => {
        const { error } = await supabase.rpc('record_stock_entry', {
          p_store_id: storeId,
          p_product_id: productId,
          p_vendor_id: vendorId || null,
          p_quantity: Number(amount),
          p_unit_cost: Number(unitCost),
          p_occurred_on: date,
          p_note: note.trim() || null,
        });
        if (error) throw error;
      }, 'Stok masuk berhasil dicatat.');
      setAmount('');
      setNote('');
    } catch {
      // The shared action handler displays the Supabase error.
    } finally { setBusy(false); }
  };
  return <>
    <PageHeading eyebrow="PERSEDIAAN" title="Stok masuk" description="Catat pembelian barang agar jumlah persediaan selalu akurat." />
    <div className="stock-layout"><section className="panel form-panel"><div className="panel-heading"><div><h2>Detail penerimaan barang</h2><p>Stok akan bertambah otomatis setelah disimpan.</p></div><span className="form-heading-icon"><ArrowDownToLine size={19} /></span></div><form className="form-stack" onSubmit={save}><Field label="Produk"><select required value={productId} onChange={(event) => { setProductId(event.target.value); const product = products.find((item) => item.id === event.target.value); if (product) setUnitCost(String(product.buy_price)); }}><option value="">Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — stok {quantity(product.stock)} {product.unit}</option>)}</select></Field><Field label="Vendor"><select value={vendorId} onChange={(event) => setVendorId(event.target.value)}><option value="">Tanpa vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></Field><div className="form-row"><Field label={`Jumlah${selectedProduct ? ` (${selectedProduct.unit})` : ''}`}><input type="number" min="0.001" step="0.001" required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field><Field label="Harga beli per unit (Rp)"><input type="number" min="0" required value={unitCost} onChange={(event) => setUnitCost(event.target.value)} /></Field></div><div className="stock-total"><span>Total nilai pembelian</span><strong>{money(Number(amount) * Number(unitCost))}</strong></div><div className="form-row"><Field label="Tanggal penerimaan"><input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Catatan"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opsional" /></Field></div><button className="button button-primary full-button" disabled={busy || !products.length}><ArrowDownToLine size={17} />{busy ? 'Menyimpan...' : 'Simpan stok masuk'}</button></form></section>
      <section className="panel stock-history"><div className="panel-heading"><div><h2>Riwayat stok masuk</h2><p>500 penerimaan terbaru</p></div></div><div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>PRODUK</th><th>VENDOR</th><th>JUMLAH</th><th className="align-right">TOTAL</th></tr></thead><tbody>{stockEntries.map((entry) => <tr key={entry.id}><td>{shortDate(entry.occurred_on)}</td><td><strong>{entry.product?.name || 'Produk dihapus'}</strong></td><td>{entry.vendor?.name || '-'}</td><td>{quantity(entry.quantity)} unit</td><td className="align-right">{money(Number(entry.quantity) * Number(entry.unit_cost))}</td></tr>)}</tbody></table>{!stockEntries.length && <EmptyState icon={Boxes} title="Belum ada penerimaan" text="Riwayat stok masuk akan tampil setelah dicatat." />}</div></section></div>
  </>;
}

function SalesPage({ sales }) {
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selected, setSelected] = useState(null);
  const filtered = sales.filter((sale) => {
    const date = sale.created_at ? localDate(sale.created_at) : '';
    return sale.code.toLowerCase().includes(search.toLowerCase())
      && (!from || date >= from)
      && (!to || date <= to);
  });
  const exportCsv = () => downloadCsv(['Nomor Transaksi,Tanggal,Subtotal,Diskon,Total,Dibayar,Kembalian', ...filtered.map((sale) => [sale.code, sale.created_at?.slice(0, 10), sale.subtotal, sale.discount, sale.total, sale.amount_paid, sale.change_amount].join(','))].join('\n'), 'laporan-penjualan.csv');
  return <>
    <section className="panel data-panel">
      <div className="sales-panel-heading">
        <h2>Transaksi</h2>
        <button className="icon-button" onClick={exportCsv} aria-label="Ekspor CSV" title="Ekspor CSV"><ArrowDownToLine size={18} /></button>
      </div>
      <div className="panel-toolbar sales-toolbar">
        <div className="sales-search-controls">
          <div className="search-field compact-search sales-search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor transaksi..." /></div>
          <div className="sales-date-filters">
            <Field label="Dari"><input type="date" aria-label="Dari tanggal" value={from} max={to || undefined} onChange={(event) => setFrom(event.target.value)} /></Field>
            <span className="sales-date-separator" aria-hidden="true">-</span>
            <Field label="Sampai"><input type="date" aria-label="Sampai tanggal" value={to} min={from || undefined} onChange={(event) => setTo(event.target.value)} /></Field>
            <button className="button button-quiet sales-date-reset" type="button" aria-label="Reset filter tanggal" disabled={!from && !to} onClick={() => { setFrom(''); setTo(''); }}><X size={14} /><span>Reset</span></button>
          </div>
        </div>
        <span className="result-count">{filtered.length} transaksi</span>
      </div>
      <div className="table-wrap"><table><thead><tr><th>NO. TRANSAKSI</th><th>TANGGAL</th><th>JUMLAH ITEM</th><th>SUBTOTAL</th><th>DISKON</th><th className="align-right">TOTAL</th></tr></thead><tbody>{filtered.map((sale) => <tr className="clickable-row" key={sale.id} onClick={() => setSelected(sale)}><td><strong className="mono">{sale.code}</strong></td><td>{shortDate(sale.created_at)}</td><td>{sale.sale_items?.length ?? 0} produk</td><td>{money(sale.subtotal)}</td><td>{money(sale.discount)}</td><td className="align-right"><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={ClipboardList} title="Transaksi tidak ditemukan" text="Belum ada transaksi yang sesuai." />}</div></section>
    {selected && <Modal title="Detail transaksi" onClose={() => setSelected(null)}><div className="sale-detail"><div className="sale-detail-top"><span className="badge badge-success">Selesai</span><strong className="mono">{selected.code}</strong><span>{shortDate(selected.created_at)}</span></div><div className="sale-items">{selected.sale_items?.map((item) => <div className="sale-item" key={item.id}><span>{item.product_name}<small>{quantity(item.quantity)} × {money(item.unit_price)}</small></span><strong>{money(Number(item.quantity) * Number(item.unit_price))}</strong></div>)}</div><div className="summary-line"><span>Subtotal</span><strong>{money(selected.subtotal)}</strong></div><div className="summary-line"><span>Diskon</span><strong>{money(selected.discount)}</strong></div><div className="summary-total"><span>Total</span><strong>{money(selected.total)}</strong></div><div className="summary-line"><span>Dibayar</span><strong>{money(selected.amount_paid)}</strong></div><div className="summary-line"><span>Kembalian</span><strong>{money(selected.change_amount)}</strong></div></div></Modal>}
  </>;
}

function ReportsPage({ sales, stockEntries }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filtered = useMemo(() => sales.filter((sale) => {
    const date = sale.created_at ? localDate(sale.created_at) : '';
    return (!from || date >= from) && (!to || date <= to);
  }), [sales, from, to]);
  const revenue = filtered.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cost = filtered.reduce((sum, sale) => sum + Number(sale.cost_total), 0);
  const profit = revenue - cost;
  const expense = stockEntries.filter((entry) => (!from || entry.occurred_on >= from) && (!to || entry.occurred_on <= to)).reduce((sum, entry) => sum + Number(entry.quantity) * Number(entry.unit_cost), 0);
  const exportCsv = () => downloadCsv(['Tanggal,Transaksi,Omzet,Harga Pokok,Laba Kotor', ...filtered.map((sale) => [sale.created_at?.slice(0, 10), sale.code, sale.total, sale.cost_total, Number(sale.total) - Number(sale.cost_total)].join(','))].join('\n'), 'laporan-laba-rugi.csv');
  return <>
    <PageHeading eyebrow="ANALISIS USAHA" title="Laba rugi" description="Ringkasan omzet dan laba kotor berdasarkan transaksi." action={<button className="button button-secondary" onClick={exportCsv}><ArrowDownToLine size={16} /> Ekspor CSV</button>} />
    <section className="panel filter-panel"><span className="filter-label">Periode laporan</span><Field label="Dari tanggal"><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></Field><span className="filter-separator">sampai</span><Field label="Sampai tanggal"><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></Field><button className="button button-quiet" onClick={() => { setFrom(''); setTo(''); }}>Reset</button></section>
    <div className="stats-grid report-stats"><StatCard label="Omzet bersih" value={money(revenue)} note={`${filtered.length} transaksi`} icon={CircleDollarSign} tone="gold" /><StatCard label="Harga pokok terjual" value={money(cost)} note="Dihitung dari harga beli saat transaksi" icon={Boxes} tone="blue" /><StatCard label="Laba kotor" value={money(profit)} note="Omzet dikurangi harga pokok" icon={TrendingUp} tone="green" /><StatCard label="Pembelian stok" value={money(expense)} note="Nilai stok masuk pada periode ini" icon={ArrowDownToLine} tone="purple" /></div>
    <section className="panel data-panel"><div className="panel-heading"><div><h2>Rincian laba per transaksi</h2><p>Harga pokok disimpan sebagai snapshot saat penjualan.</p></div></div><div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>NO. TRANSAKSI</th><th>OMZET</th><th>HARGA POKOK</th><th className="align-right">LABA KOTOR</th></tr></thead><tbody>{filtered.map((sale) => <tr key={sale.id}><td>{shortDate(sale.created_at)}</td><td className="mono">{sale.code}</td><td>{money(sale.total)}</td><td>{money(sale.cost_total)}</td><td className="align-right"><strong className={Number(sale.total) - Number(sale.cost_total) >= 0 ? 'positive-value' : 'negative-value'}>{money(Number(sale.total) - Number(sale.cost_total))}</strong></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={BarChart3} title="Belum ada data laporan" text="Transaksi pada periode ini akan muncul di sini." />}</div></section>
  </>;
}

function SettingsPage({ store, settings, storeId, run, onStoreUpdated }) {
  const [storeName, setStoreName] = useState(store.name ?? '');
  const [address, setAddress] = useState(settings?.address ?? '');
  const [phone, setPhone] = useState(settings?.phone ?? '');
  const [footer, setFooter] = useState(settings?.receipt_footer ?? 'Terima kasih atas kunjungan Anda!');
  const [threshold, setThreshold] = useState(String(settings?.low_stock_threshold ?? 5));
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setStoreName(store.name ?? '');
    setAddress(settings?.address ?? '');
    setPhone(settings?.phone ?? '');
    setFooter(settings?.receipt_footer ?? 'Terima kasih atas kunjungan Anda!');
    setThreshold(String(settings?.low_stock_threshold ?? 5));
  }, [store, settings]);
  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      await run(async () => {
        const storeResult = await supabase.from('stores').update({ name: storeName.trim() }).eq('id', storeId).select('id, name').single();
        if (storeResult.error) throw storeResult.error;
        onStoreUpdated(storeResult.data);
        const settingsResult = await supabase.from('store_settings').update({
          address: address.trim() || null,
          phone: phone.trim() || null,
          receipt_footer: footer.trim(),
          low_stock_threshold: Number(threshold),
        }).eq('store_id', storeId);
        if (settingsResult.error) throw settingsResult.error;
      }, 'Pengaturan toko berhasil disimpan.');
    } catch {
      // The shared action handler displays the Supabase error.
    } finally { setBusy(false); }
  };
  return <>
    <PageHeading eyebrow="PREFERENSI" title="Pengaturan" description="Atur informasi toko, struk, dan batas minimum stok." />
    <section className="panel settings-panel"><div className="panel-heading"><div><h2>Informasi toko</h2><p>Informasi ini digunakan pada ruang kerja dan bukti transaksi.</p></div><span className="form-heading-icon"><Settings size={19} /></span></div><form className="form-stack" onSubmit={save}><Field label="Nama toko"><input required value={storeName} onChange={(event) => setStoreName(event.target.value)} /></Field><div className="form-row"><Field label="Nomor telepon"><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Nomor kontak toko" /></Field><Field label="Batas minimum stok"><input type="number" min="0" step="0.1" required value={threshold} onChange={(event) => setThreshold(event.target.value)} /></Field></div><Field label="Alamat toko"><textarea rows="3" value={address} onChange={(event) => setAddress(event.target.value)} /></Field><Field label="Pesan pada struk"><textarea rows="2" value={footer} onChange={(event) => setFooter(event.target.value)} /></Field><div className="settings-note"><ShieldCheck size={18} /><span><strong>Keamanan data aktif</strong><small>Setiap tabel memakai Row Level Security. Hanya anggota toko yang dapat mengakses data.</small></span></div><button className="button button-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan pengaturan'}<Check size={16} /></button></form></section>
  </>;
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Tutup"><X size={19} /></button></div>{children}</section></div>;
}

function ModalActions({ onCancel, busy }) {
  return <div className="modal-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Batal</button><button type="submit" className="button button-primary" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan'}<Check size={16} /></button></div>;
}

function downloadCsv(content, filename) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default App;
