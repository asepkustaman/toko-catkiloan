import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowRight, BarChart3, Boxes, BriefcaseBusiness, CalendarDays, Check,
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
  { id: 'zakat', label: 'Zakat', icon: CircleDollarSign },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

function SidebarIcon({ id }) {
  const iconContent = {
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="2.4" /><rect x="13" y="3" width="8" height="5" rx="2" /><rect x="13" y="10" width="8" height="11" rx="2.4" /><rect x="3" y="13" width="8" height="8" rx="2.4" /><path d="M5.5 8V6.5A1.5 1.5 0 0 1 7 5h1m7 1h3m-3 7h3M5.5 18v-2A1.5 1.5 0 0 1 7 14.5h1" strokeWidth="1.5" /></>,
    pos: <><rect x="4" y="3" width="16" height="14" rx="3" /><path d="M7.5 6.5h9v4h-9z" fill="currentColor" opacity=".2" /><path d="M7.5 13h2m2 0h2m2 0h1M9 17v2.5h6V17" /><path d="M10 19.5h4" strokeWidth="2.4" /></>,
    sales: <><path d="M6 3.5h9l4 4V18l-2 2.5H7L5 18V5a1.5 1.5 0 0 1 1-1.5Z" /><path d="M14.5 4v4H19M8.5 11h7m-7 3h7" /><path d="M8.5 17h2m2 0h3" strokeWidth="2.2" /><path d="M5.5 19.5 7 18l1.5 1.5L10 18l1.5 1.5L13 18l1.5 1.5L16 18l1.5 1.5" strokeWidth="1.4" /></>,
    stock: <><path d="m3.5 8 8.5-4.5L20.5 8v9l-8.5 4.5L3.5 17V8Z" /><path d="m4 8.5 8 4.2 8-4.2M12 12.7v8" /><path d="M12 3.5v6m-2.5-2.5L12 9.5l2.5-2.5" strokeWidth="2.2" /><circle cx="12" cy="7" r="4.3" fill="currentColor" opacity=".12" /></>,
    products: <><path d="M5.5 7.5h13l-1.2 12H6.7l-1.2-12Z" /><path d="M4.5 7.5h15M8 7.5l1-4h6l1 4M8 11h8" /><path d="m9 15 2 2 4-4" strokeWidth="2.1" /><path d="M8 5h8" strokeWidth="1.5" /></>,
    vendors: <><path d="M2.5 7h11v10h-11z" /><path d="M13.5 10h4l4 4v3h-8" /><path d="M15.5 10.5v3.8h5" /><circle cx="7" cy="18" r="2" /><circle cx="17.5" cy="18" r="2" /><path d="M5 10h5m-5 3h3" /><path d="m7 4 1.5 1.5L10 4" strokeWidth="1.6" /></>,
    reports: <><path d="M4 20h16" /><rect x="5.5" y="12" width="3" height="6" rx="1" /><rect x="10.5" y="8" width="3" height="10" rx="1" /><rect x="15.5" y="4" width="3" height="14" rx="1" /><path d="m5 9 4-3 3 1 6-4m-3 0h3v3" strokeWidth="1.7" /><circle cx="18" cy="4" r="1.5" fill="currentColor" /></>,
    zakat: <><circle cx="12" cy="12" r="9" /><path d="M8.5 15.5c.8.8 1.9 1.2 3.2 1.2 1.8 0 3-.8 3-2s-1-1.8-2.8-2.3-2.8-1-2.8-2.3 1.2-2.2 3-2.2c1.1 0 2.1.4 2.8 1.1M12 6v12" strokeWidth="1.6" /><path d="m17.5 4.5 2-2m-1 4h3" strokeWidth="1.4" /></>,
    settings: <><path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" /><circle cx="9" cy="6" r="2.4" fill="currentColor" /><circle cx="15.5" cy="12" r="2.4" fill="currentColor" /><circle cx="7" cy="18" r="2.4" fill="currentColor" /><path d="M9 5.3v1.4m6.5-.7v12m-8 0v.1" stroke="white" strokeWidth="1.1" /></>,
  }[id];

  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{iconContent}</svg>;
}

const currency = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});
const currencyInputFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const NOTICE_DURATION = 3500;
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
  const noticeSequence = useRef(0);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [settings, setSettings] = useState(null);

  const notify = (type, text) => setNotice({ id: ++noticeSequence.current, type, text });

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(null), NOTICE_DURATION);
    return () => window.clearTimeout(timeout);
  }, [notice]);

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
    loadData(false).catch((error) => notify('error', `Gagal memuat data: ${errorMessage(error)}`));
  }, [store, loadData]);

  const run = async (action, successText) => {
    try {
      await action();
      if (successText) notify('success', successText);
      await loadData();
    } catch (error) {
      notify('error', errorMessage(error));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      notify('error', `Gagal keluar: ${errorMessage(error)}`);
    }
  };

  const canManage = store?.role === 'owner' || store?.role === 'manager';
  const permittedNavItems = canManage
    ? navItems
    : navItems.filter((item) => ['dashboard', 'pos', 'sales'].includes(item.id));
  const navigate = (nextPage) => {
    if (!canManage && !['dashboard', 'pos', 'sales'].includes(nextPage)) {
      notify('error', 'Akses ini hanya tersedia untuk pemilik atau pengelola toko.');
      return;
    }
    if (nextPage !== page) setNotice(null);
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
          {permittedNavItems.map(({ id, label }) => (
            <button key={id} className={`nav-item ${page === id ? 'nav-active' : ''}`} aria-label={label} onClick={() => navigate(id)}>
             <SidebarIcon id={id} /><span>{label}</span>
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
        {notice && <div key={notice.id} className={`toast toast-${notice.type}`} style={{ '--toast-duration': `${NOTICE_DURATION}ms` }} role={notice.type === 'error' ? 'alert' : 'status'}>
          <span className="toast-icon" aria-hidden="true">{notice.type === 'success' ? <Check size={17} strokeWidth={2.5} /> : <X size={17} strokeWidth={2.5} />}</span>
          <span className="toast-copy"><strong>{notice.type === 'success' ? 'Berhasil' : 'Perlu perhatian'}</strong><span>{notice.text}</span></span>
          <button onClick={() => setNotice(null)} aria-label="Tutup notifikasi" title="Tutup"><X size={16} /></button>
          <span key={notice.id} className="toast-progress" aria-hidden="true" />
        </div>}
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
          {page === 'zakat' && canManage && <ZakatPage sales={sales} />}
          {!canManage && ['stock', 'products', 'vendors', 'reports', 'zakat', 'settings'].includes(page) && <EmptyState icon={ShieldCheck} title="Akses terbatas" text="Halaman ini hanya tersedia untuk pemilik atau pengelola toko." />}
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
              <AnimatedLoginButton busy={busy} success={transitioning} disabled={Boolean(setupError)} />
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

function AnimatedLoginButton({ busy, success, disabled }) {
  const buttonRef = useRef(null);
  const labelRef = useRef(null);
  const arrowRef = useRef(null);
  const checkRef = useRef(null);
  const ringRef = useRef(null);
  const ringCircleRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const label = labelRef.current;
    const arrow = arrowRef.current;
    const check = checkRef.current;
    const ring = ringRef.current;
    const ringCircle = ringCircleRef.current;
    if (!button || !label || !arrow || !check || !ring || !ringCircle || (!busy && !success)) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const letters = Array.from(label.children);
    const animations = [];
    let cancelled = false;
    const animate = (element, frames, options) => {
      const animation = element.animate(frames, options);
      animations.push(animation);
      return animation;
    };
    const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

    const cleanup = () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
      [button, label, arrow, check, ring, ringCircle, ...letters].forEach((element) => {
        element.style.removeProperty('width');
        element.style.removeProperty('margin-right');
        element.style.removeProperty('opacity');
      });
    };

    if (success) {
      const bounds = button.getBoundingClientRect();
      const height = bounds.height;
      const radius = getComputedStyle(button).borderRadius;
      label.style.width = '0px';
      label.style.marginRight = '0px';
      letters.forEach((letter) => { letter.style.opacity = '0'; });
      animate(button, [
        { width: `${bounds.width}px`, borderRadius: radius },
        { width: `${height}px`, borderRadius: `${height / 2}px` },
      ], { duration: 320, fill: 'forwards', easing: 'cubic-bezier(.65,0,.35,1)' });
      animate(ring, [{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 480, fill: 'forwards' });
      animate(arrow, [{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: 'forwards' });
      animate(ringCircle, [{ strokeDasharray: '118 52' }, { strokeDasharray: '170 0' }], { duration: 280, delay: 100, fill: 'forwards', easing: 'ease-out' });
      animate(check, [{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], { duration: 320, delay: 130, fill: 'forwards', easing: 'ease-out' });
      return cleanup;
    }

    const bounds = button.getBoundingClientRect();
    const iconBounds = arrow.getBoundingClientRect();
    const centerX = iconBounds.left + iconBounds.width / 2;
    const centerY = iconBounds.top + iconBounds.height / 2;
    const offsets = letters.map((letter) => {
      const rect = letter.getBoundingClientRect();
      return { x: centerX - (rect.left + rect.width / 2), y: centerY - (rect.top + rect.height / 2) };
    });
    const count = letters.length;

    letters.forEach((letter, index) => {
      const delay = (count - 1 - index) * 32;
      animate(letter, [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        { transform: `translate(${offsets[index].x * 0.2}px,-8px) scale(1.12) rotate(-8deg)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${offsets[index].x}px,${offsets[index].y}px) scale(.15) rotate(30deg)`, opacity: 0 },
      ], { duration: 360, delay, fill: 'forwards', easing: 'cubic-bezier(.55,.05,.85,.45)' });
    });

    (async () => {
      await wait((count - 1) * 32 + 390);
      if (cancelled) return;
      const labelWidth = label.getBoundingClientRect().width;
      const marginRight = parseFloat(getComputedStyle(label).marginRight) || 0;
      const radius = getComputedStyle(button).borderRadius;
      animate(button, [
        { width: `${bounds.width}px`, borderRadius: radius },
        { width: `${bounds.height}px`, borderRadius: `${bounds.height / 2}px` },
      ], { duration: 420, fill: 'forwards', easing: 'cubic-bezier(.65,0,.35,1)' });
      animate(label, [
        { width: `${labelWidth}px`, marginRight: `${marginRight}px` },
        { width: '0px', marginRight: '0px' },
      ], { duration: 420, fill: 'forwards', easing: 'cubic-bezier(.65,0,.35,1)' });
      await wait(440);
      if (cancelled) return;
      animate(ring, [{ opacity: 0 }, { opacity: 1 }], { duration: 180, fill: 'forwards' });
      animate(ring, [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: 800, iterations: Infinity, easing: 'linear' });
      animate(arrow, [
        { transform: 'translateX(-7px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1, offset: 0.4 },
        { transform: 'translateX(0)', opacity: 1, offset: 0.6 },
        { transform: 'translateX(7px)', opacity: 0 },
      ], { duration: 800, iterations: Infinity, easing: 'ease-in-out' });
    })();

    return cleanup;
  }, [busy, success]);

  const characters = 'Masuk ke aplikasi'.split('');
  return (
    <button
      ref={buttonRef}
      className={`button button-primary full-button auth-submit${busy ? ' is-busy' : ''}${success ? ' is-success' : ''}`}
      type="submit"
      disabled={disabled || busy || success}
      aria-label="Masuk ke aplikasi"
      aria-busy={busy && !success}
    >
      <span className="auth-submit-label" ref={labelRef} aria-hidden="true">
        {characters.map((character, index) => <span className="auth-submit-letter" key={`${character}-${index}`}>{character === ' ' ? '\u00a0' : character}</span>)}
      </span>
      <span className="auth-submit-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 5v14" />
          <g ref={arrowRef}><path d="M4 12h16M14 6l6 6-6 6" /></g>
          <path ref={checkRef} className="auth-submit-check" d="m5 13 5 5 10-11" />
        </svg>
      </span>
      <svg ref={ringRef} className="auth-submit-ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle ref={ringCircleRef} cx="32" cy="32" r="27" transform="rotate(-90 32 32)" />
      </svg>
    </button>
  );
}

function Brand() {
  return <div className="brand"><img className="brand-logo" src={`${import.meta.env.BASE_URL}paint-store-logo.png`} alt="Paint Store" /></div>;
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
        {recent.length ? <div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>No. transaksi</th><th>Tanggal</th><th>Item</th><th className="align-right">Total</th></tr></thead><tbody>{recent.map((sale, index) => <tr key={sale.id}><td className="row-number">{index + 1}</td><td><strong className="mono">{sale.code}</strong></td><td>{shortDate(sale.created_at)}</td><td>{sale.sale_items?.length ?? 0} produk</td><td className="align-right"><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table></div> : <EmptyState icon={ClipboardList} title="Belum ada transaksi" text="Transaksi penjualan akan tampil di sini." /> }
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

function DatePickerField({ label, value, onChange, min, max }) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const selectedDate = value ? new Date(`${value}T12:00:00`) : null;
  const displayDate = selectedDate ? value.split('-').reverse().join('/') : 'dd/mm/yyyy';
  const todayDate = new Date();
  const todayIso = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
  const monthLabel = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(visibleMonth);
  const firstDay = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - ((firstDay.getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  const toggleCalendar = () => {
    if (!isOpen) {
      const initialDate = selectedDate ?? todayDate;
      setVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    }
    setIsOpen((open) => !open);
  };
  const changeMonth = (amount) => {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + amount, 1));
  };
  const selectDate = (date) => {
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    onChange(isoDate);
    setIsOpen(false);
    triggerRef.current?.focus();
  };
  const isWithinRange = (date) => {
    const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return (!min || isoDate >= min) && (!max || isoDate <= max);
  };

  return <div className="field"><span className="date-field-label">{label}</span><span className="sales-date-input" ref={containerRef}>
    <button className={`sales-date-picker${isOpen ? ' is-open' : ''}`} ref={triggerRef} type="button" aria-label={`Pilih ${label.toLowerCase()}`} aria-expanded={isOpen} aria-haspopup="dialog" onClick={toggleCalendar}><CalendarDays size={15} /><span>{displayDate}</span><span className="date-picker-caret" aria-hidden="true" /></button>
    {isOpen && <span className="date-calendar" role="dialog" aria-label={`Kalender ${label.toLowerCase()}`}>
      <span className="date-calendar-header"><button type="button" aria-label="Bulan sebelumnya" onClick={() => changeMonth(-1)}>‹</button><strong>{monthLabel}</strong><button type="button" aria-label="Bulan berikutnya" onClick={() => changeMonth(1)}>›</button></span>
      <span className="date-calendar-grid">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day) => <span className="date-calendar-weekday" key={day}>{day}</span>)}
        {days.map((date) => {
          const isoDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          const isSelected = isoDate === value;
          const isToday = isoDate === todayIso;
          return <button className={`date-calendar-day${date.getMonth() !== visibleMonth.getMonth() ? ' is-outside-month' : ''}${isSelected ? ' is-selected' : ''}${isToday ? ' is-today' : ''}`} type="button" key={isoDate} disabled={!isWithinRange(date)} aria-label={new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(date)} aria-pressed={isSelected} onClick={() => selectDate(date)}>{date.getDate()}</button>;
        })}
      </span>
      <span className="date-calendar-footer"><button type="button" onClick={() => { onChange(''); setIsOpen(false); triggerRef.current?.focus(); }}>Hapus tanggal</button><button type="button" disabled={!isWithinRange(todayDate)} onClick={() => selectDate(todayDate)}>Hari ini</button></span>
    </span>}
  </span></div>;
}

function CurrencyInput({ value, onChange, ...inputProps }) {
  const inputRef = useRef(null);
  const rawValue = value === '' || value == null ? '' : String(value);
  const formattedValue = rawValue === '' ? '' : currencyInputFormat.format(Number(rawValue) || 0);
  const handleChange = (event) => {
    const input = event.currentTarget;
    const cursor = input.selectionStart ?? input.value.length;
    const digitsBeforeCursor = input.value.slice(0, cursor).replace(/\D/g, '').length;
    const nextValue = input.value.replace(/\D/g, '');
    onChange(nextValue);
    window.requestAnimationFrame(() => {
      if (document.activeElement !== inputRef.current) return;
      const nextFormattedValue = nextValue ? currencyInputFormat.format(Number(nextValue) || 0) : '';
      let nextCursor = 0;
      let digitCount = 0;
      while (nextCursor < nextFormattedValue.length && digitCount < digitsBeforeCursor) {
        if (/\d/.test(nextFormattedValue[nextCursor])) digitCount += 1;
        nextCursor += 1;
      }
      inputRef.current.setSelectionRange(nextCursor, nextCursor);
    });
  };
  return <span className="currency-input"><span aria-hidden="true">Rp</span><input {...inputProps} ref={inputRef} type="text" inputMode="numeric" value={formattedValue} onChange={handleChange} /></span>;
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
        <div className="cart-summary"><div className="summary-line"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><Field label="Diskon"><CurrencyInput value={discount} onChange={setDiscount} placeholder="Masukkan nominal diskon" /></Field><div className="summary-total"><span>Total pembayaran</span><strong>{money(total)}</strong></div><Field label="Uang diterima"><CurrencyInput value={paid} onChange={setPaid} placeholder="Masukkan nominal pembayaran" /></Field><div className="summary-line change-line"><span>Kembalian</span><strong>{money(change)}</strong></div><button className="button button-primary full-button checkout-button" disabled={!cart.length || Number(paid) < total || busy} onClick={checkout}><CreditCard size={17} />{busy ? 'Menyimpan transaksi...' : 'Selesaikan transaksi'}</button></div>
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
    <section className="panel data-panel"><div className="panel-toolbar product-toolbar"><div className="search-field compact-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari produk..." /></div><span className="result-count">{filtered.length} produk</span><button className="button button-primary header-action-button" onClick={() => open()}><span className="header-action-icon"><Package size={17} /><Plus size={10} strokeWidth={3} /></span><span>Tambah produk</span></button></div>
      <div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>PRODUK</th><th>BARCODE</th><th>KATEGORI</th><th>VENDOR</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th><th /></tr></thead><tbody>
        {filtered.map((product, index) => <tr key={product.id}><td className="row-number">{index + 1}</td><td><div className="table-product"><span className="product-initial">{product.name.slice(0, 1)}</span><strong>{product.name}</strong></div></td><td className="mono">{product.barcode || '-'}</td><td>{product.category?.name || '-'}</td><td>{product.vendor?.name || '-'}</td><td><strong>{money(product.sell_price)}</strong></td><td>{quantity(product.stock)} {product.unit}</td><td><span className={`badge ${Number(product.stock) <= Number(threshold) ? 'badge-warning' : 'badge-success'}`}>{Number(product.stock) <= Number(threshold) ? 'Stok menipis' : 'Tersedia'}</span></td><td><div className="row-actions"><button className="icon-button" onClick={() => open(product)} aria-label="Edit"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(product)} aria-label="Hapus"><Trash2 size={15} /></button></div></td></tr>)}
      </tbody></table>{!filtered.length && <EmptyState icon={Package} title="Belum ada produk" text="Tambahkan produk untuk mulai mencatat persediaan dan penjualan." />}</div>
    </section>
    {modal && <Modal title={editing ? 'Edit produk' : 'Tambah produk'} onClose={() => setModal(false)}><form className="form-stack" onSubmit={save}><Field label="Nama produk"><input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Contoh: Cat Tembok Putih" /></Field><div className="form-row"><Field label="Kategori" hint="Kategori baru otomatis dibuat."><input list="category-options" required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Pilih atau ketik kategori" /><datalist id="category-options">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist></Field><Field label="Barcode"><input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} placeholder="Opsional" /></Field></div><Field label="Vendor"><select value={form.vendor_id} onChange={(event) => setForm({ ...form, vendor_id: event.target.value })}><option value="">Tanpa vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></Field><div className="form-row"><Field label="Harga beli"><CurrencyInput required value={form.buy_price} onChange={(buy_price) => setForm({ ...form, buy_price })} /></Field><Field label="Harga jual"><CurrencyInput required value={form.sell_price} onChange={(sell_price) => setForm({ ...form, sell_price })} /></Field></div>{form.buy_price !== '' && form.sell_price !== '' && Number(form.sell_price) <= Number(form.buy_price) && <p className="inline-error">Harga jual harus lebih tinggi dari harga beli.</p>}<ModalActions onCancel={() => setModal(false)} busy={busy} /></form></Modal>}
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
    <section className="panel data-panel"><div className="panel-toolbar"><strong className="panel-toolbar-title">{vendors.length} vendor terdaftar</strong><button className="button button-primary header-action-button" onClick={() => open()}><span className="header-action-icon"><BriefcaseBusiness size={17} /><Plus size={10} strokeWidth={3} /></span><span>Tambah vendor</span></button></div><div className="vendor-grid">{vendors.map((vendor) => <article className="vendor-row" key={vendor.id}><div className="vendor-row-identity"><span className="vendor-row-icon"><BriefcaseBusiness size={16} /></span><strong>{vendor.name}</strong></div><div className="vendor-row-detail"><span>Kontak</span><strong>{vendor.contact || 'Belum tersedia'}</strong></div><div className="vendor-row-detail vendor-row-address"><span>Alamat</span><strong>{vendor.address || 'Belum tersedia'}</strong></div><div className="row-actions"><button className="icon-button" onClick={() => open(vendor)} aria-label={`Edit ${vendor.name}`} title="Edit"><Pencil size={15} /></button><button className="icon-button danger-icon" onClick={() => remove(vendor)} aria-label={`Hapus ${vendor.name}`} title="Hapus"><Trash2 size={15} /></button></div></article>)}</div>{!vendors.length && <EmptyState icon={Truck} title="Belum ada vendor" text="Tambahkan vendor untuk menghubungkan pemasok dengan stok masuk." />}</section>
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
    <div className="stock-layout"><section className="panel form-panel"><div className="panel-heading"><div><h2>Detail penerimaan barang</h2><p>Stok akan bertambah otomatis setelah disimpan.</p></div><span className="form-heading-icon"><ArrowDownToLine size={19} /></span></div><form className="form-stack" onSubmit={save}><Field label="Produk"><select required value={productId} onChange={(event) => { setProductId(event.target.value); const product = products.find((item) => item.id === event.target.value); if (product) setUnitCost(String(product.buy_price)); }}><option value="">Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — stok {quantity(product.stock)} {product.unit}</option>)}</select></Field><Field label="Vendor"><select value={vendorId} onChange={(event) => setVendorId(event.target.value)}><option value="">Tanpa vendor</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></Field><div className="form-row"><Field label={`Jumlah${selectedProduct ? ` (${selectedProduct.unit})` : ''}`}><input type="number" min="0.001" step="0.001" required value={amount} onChange={(event) => setAmount(event.target.value)} /></Field><Field label="Harga beli per unit"><CurrencyInput required value={unitCost} onChange={setUnitCost} /></Field></div><div className="stock-total"><span>Total nilai pembelian</span><strong>{money(Number(amount) * Number(unitCost))}</strong></div><div className="form-row"><Field label="Tanggal penerimaan"><input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label="Catatan"><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opsional" /></Field></div><button className="button button-primary full-button" disabled={busy || !products.length}><ArrowDownToLine size={17} />{busy ? 'Menyimpan...' : 'Simpan stok masuk'}</button></form></section>
      <section className="panel stock-history"><div className="panel-heading"><div><h2>Riwayat stok masuk</h2><p>500 penerimaan terbaru</p></div></div><div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>TANGGAL</th><th>PRODUK</th><th>VENDOR</th><th>JUMLAH</th><th className="align-right">TOTAL</th></tr></thead><tbody>{stockEntries.map((entry, index) => <tr key={entry.id}><td className="row-number">{index + 1}</td><td>{shortDate(entry.occurred_on)}</td><td><strong>{entry.product?.name || 'Produk dihapus'}</strong></td><td>{entry.vendor?.name || '-'}</td><td>{quantity(entry.quantity)} unit</td><td className="align-right">{money(Number(entry.quantity) * Number(entry.unit_cost))}</td></tr>)}</tbody></table>{!stockEntries.length && <EmptyState icon={Boxes} title="Belum ada penerimaan" text="Riwayat stok masuk akan tampil setelah dicatat." />}</div></section></div>
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
  const exportCsv = () => downloadCsv(['Nomor Transaksi,Tanggal,Subtotal (Rp),Diskon (Rp),Total (Rp),Dibayar (Rp),Kembalian (Rp)', ...filtered.map((sale) => [sale.code, sale.created_at?.slice(0, 10), sale.subtotal, sale.discount, sale.total, sale.amount_paid, sale.change_amount].join(','))].join('\n'), 'laporan-penjualan.csv');
  return <>
    <section className="panel data-panel">
      <div className="sales-panel-heading">
        <h2>Transaksi</h2>
        <button className="button button-primary header-action-button export-action-button" onClick={exportCsv} aria-label="Ekspor CSV" title="Ekspor CSV"><span className="header-action-icon"><ArrowDownToLine size={17} /></span><span>Ekspor</span></button>
      </div>
      <div className="panel-toolbar sales-toolbar">
        <div className="sales-search-controls">
          <div className="search-field compact-search sales-search-field"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nomor transaksi..." /></div>
          <div className="sales-date-filters">
            <DatePickerField label="Dari" value={from} max={to || undefined} onChange={setFrom} />
            <span className="sales-date-separator" aria-hidden="true">-</span>
            <DatePickerField label="Sampai" value={to} min={from || undefined} onChange={setTo} />
            <button className="button button-quiet sales-date-reset" type="button" aria-label="Reset filter tanggal" disabled={!from && !to} onClick={() => { setFrom(''); setTo(''); }}><X size={14} /><span>Reset</span></button>
          </div>
        </div>
        <span className="result-count">{filtered.length} transaksi</span>
      </div>
      <div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>NO. TRANSAKSI</th><th>TANGGAL</th><th>JUMLAH ITEM</th><th>SUBTOTAL</th><th>DISKON</th><th className="align-right">TOTAL</th></tr></thead><tbody>{filtered.map((sale, index) => <tr className="clickable-row" key={sale.id} onClick={() => setSelected(sale)}><td className="row-number">{index + 1}</td><td><strong className="mono">{sale.code}</strong></td><td>{shortDate(sale.created_at)}</td><td>{sale.sale_items?.length ?? 0} produk</td><td>{money(sale.subtotal)}</td><td>{money(sale.discount)}</td><td className="align-right"><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={ClipboardList} title="Transaksi tidak ditemukan" text="Belum ada transaksi yang sesuai." />}</div></section>
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
  const exportCsv = () => downloadCsv(['Tanggal,Transaksi,Omzet (Rp),Harga Pokok (Rp),Laba Kotor (Rp)', ...filtered.map((sale) => [sale.created_at?.slice(0, 10), sale.code, sale.total, sale.cost_total, Number(sale.total) - Number(sale.cost_total)].join(','))].join('\n'), 'laporan-laba-rugi.csv');
  return <>
    <section className="panel filter-panel"><span className="filter-label">Periode laporan</span><div className="sales-date-filters report-date-filters"><DatePickerField label="Dari" value={from} max={to || undefined} onChange={setFrom} /><span className="sales-date-separator" aria-hidden="true">-</span><DatePickerField label="Sampai" value={to} min={from || undefined} onChange={setTo} /><button className="button button-quiet sales-date-reset" type="button" aria-label="Reset filter tanggal" disabled={!from && !to} onClick={() => { setFrom(''); setTo(''); }}><X size={14} /><span>Reset</span></button></div><button className="button button-secondary" onClick={exportCsv}><ArrowDownToLine size={16} /> Ekspor CSV</button></section>
    <div className="stats-grid report-stats"><StatCard label="Omzet bersih" value={money(revenue)} note={`${filtered.length} transaksi`} icon={CircleDollarSign} tone="gold" /><StatCard label="Harga pokok terjual" value={money(cost)} note="Dihitung dari harga beli saat transaksi" icon={Boxes} tone="blue" /><StatCard label="Laba kotor" value={money(profit)} note="Omzet dikurangi harga pokok" icon={TrendingUp} tone="green" /><StatCard label="Pembelian stok" value={money(expense)} note="Nilai stok masuk pada periode ini" icon={ArrowDownToLine} tone="purple" /></div>
    <section className="panel data-panel"><div className="panel-heading report-table-heading"><div><h2>Rincian laba per transaksi</h2></div></div><div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>TANGGAL</th><th>NO. TRANSAKSI</th><th>OMZET</th><th>HARGA POKOK</th><th className="align-right">LABA KOTOR</th></tr></thead><tbody>{filtered.map((sale, index) => <tr key={sale.id}><td className="row-number">{index + 1}</td><td>{shortDate(sale.created_at)}</td><td className="mono">{sale.code}</td><td>{money(sale.total)}</td><td>{money(sale.cost_total)}</td><td className="align-right"><strong className={Number(sale.total) - Number(sale.cost_total) >= 0 ? 'positive-value' : 'negative-value'}>{money(Number(sale.total) - Number(sale.cost_total))}</strong></td></tr>)}</tbody></table>{!filtered.length && <EmptyState icon={BarChart3} title="Belum ada data laporan" text="Transaksi pada periode ini akan muncul di sini." />}</div></section>
  </>;
}

function ZakatPage({ sales }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const filtered = useMemo(() => sales.filter((sale) => {
    const date = sale.created_at ? localDate(sale.created_at) : '';
    return (!from || date >= from) && (!to || date <= to);
  }), [sales, from, to]);
  const grossRevenue = filtered.reduce((sum, sale) => sum + Number(sale.subtotal), 0);
  const discount = filtered.reduce((sum, sale) => sum + Number(sale.discount), 0);
  const netRevenue = filtered.reduce((sum, sale) => sum + Number(sale.total), 0);
  const cost = filtered.reduce((sum, sale) => sum + Number(sale.cost_total), 0);
  const profit = netRevenue - cost;
  const zakat = Math.round(Math.max(0, profit) * 0.025);
  const exportCsv = () => downloadCsv([
    'Tanggal,Nomor Transaksi,Omzet kotor (Rp),Diskon (Rp),Omzet bersih (Rp),HPP (Rp),Laba setelah HPP (Rp)',
    ...filtered.map((sale) => [
      sale.created_at?.slice(0, 10),
      sale.code,
      sale.subtotal,
      sale.discount,
      sale.total,
      sale.cost_total,
      Number(sale.total) - Number(sale.cost_total),
    ].join(',')),
  ].join('\n'), 'perhitungan-zakat.csv');

  return <>
    <section className="panel filter-panel">
      <span className="filter-label">Periode perhitungan</span>
      <div className="sales-date-filters report-date-filters">
        <DatePickerField label="Dari" value={from} max={to || undefined} onChange={setFrom} />
        <span className="sales-date-separator" aria-hidden="true">-</span>
        <DatePickerField label="Sampai" value={to} min={from || undefined} onChange={setTo} />
        <button className="button button-quiet sales-date-reset" type="button" aria-label="Reset filter tanggal" disabled={!from && !to} onClick={() => { setFrom(''); setTo(''); }}><X size={14} /><span>Reset</span></button>
      </div>
      <button className="button button-secondary" onClick={exportCsv}><ArrowDownToLine size={16} /> Ekspor CSV</button>
    </section>

    <div className="zakat-summary-grid">
      <section className="panel zakat-breakdown">
        <div className="panel-heading"><div><h2>Rincian perhitungan</h2><p>{filtered.length} transaksi dalam periode</p></div></div>
        <div className="zakat-calculation">
          <div className="zakat-line"><span>Omzet kotor</span><strong>{money(grossRevenue)}</strong></div>
          <div className="zakat-line zakat-deduction"><span>Diskon penjualan</span><strong>− {money(discount)}</strong></div>
          <div className="zakat-line zakat-subtotal"><span>Omzet bersih</span><strong>{money(netRevenue)}</strong></div>
          <div className="zakat-line zakat-deduction"><span>Harga pokok penjualan (HPP)</span><strong>− {money(cost)}</strong></div>
          <div className="zakat-line zakat-profit"><span>Laba setelah HPP</span><strong>{money(profit)}</strong></div>
          <div className="zakat-line zakat-rate"><span>Tarif zakat</span><strong>2,5%</strong></div>
        </div>
        <p className="zakat-method-note">Perhitungan menggunakan omzet bersih dikurangi HPP, tanpa pengurangan biaya usaha.</p>
      </section>
      <section className="panel zakat-total-panel">
        <span className="zakat-total-label">Zakat periode ini</span>
        <strong className="zakat-total-value">{money(zakat)}</strong>
        <span className="zakat-total-formula">Laba positif × 2,5%</span>
        {profit <= 0 && <span className="zakat-no-profit">Tidak ada zakat yang dihitung karena laba periode ini tidak positif.</span>}
      </section>
    </div>

    <section className="panel data-panel zakat-transactions">
      <div className="panel-heading"><div><h2>Rincian transaksi</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th className="row-number">NO.</th><th>TANGGAL</th><th>NO. TRANSAKSI</th><th>OMZET KOTOR</th><th>DISKON</th><th>OMZET BERSIH</th><th>HPP</th><th className="align-right">LABA SETELAH HPP</th></tr></thead><tbody>
        {filtered.map((sale, index) => <tr key={sale.id}><td className="row-number">{index + 1}</td><td>{shortDate(sale.created_at)}</td><td className="mono">{sale.code}</td><td>{money(sale.subtotal)}</td><td>{money(sale.discount)}</td><td>{money(sale.total)}</td><td>{money(sale.cost_total)}</td><td className="align-right"><strong className={Number(sale.total) - Number(sale.cost_total) >= 0 ? 'positive-value' : 'negative-value'}>{money(Number(sale.total) - Number(sale.cost_total))}</strong></td></tr>)}
      </tbody></table>{!filtered.length && <EmptyState icon={CircleDollarSign} title="Belum ada transaksi pada periode ini" text="Pilih rentang tanggal lain untuk melihat rincian perhitungan zakat." />}</div>
    </section>
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
