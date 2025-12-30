import { useState, useEffect } from 'react';
import { apiClient } from '../api';
import { Package, Voucher } from '../api/types';
import { PackageCard } from '../components';
import { useTheme } from '../contexts';
import './IndexPage.css';

/**
 * Public Index Page Component
 * Premium Landing Page with modern design
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */
function IndexPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [vouchersLoading, setVouchersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const activePackages = await apiClient.getActivePackages();
        // Sort packages by price (lowest to highest)
        const sortedPackages = activePackages.sort((a, b) => a.price - b.price);
        setPackages(sortedPackages);
        setError(null);
      } catch (err) {
        setError('Gagal memuat paket. Silakan coba lagi nanti.');
        console.error('Error fetching packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setVouchersLoading(true);
        const activeVouchers = await apiClient.getActiveVouchers();
        // Sort vouchers by price (lowest to highest)
        const sortedVouchers = activeVouchers.sort((a, b) => a.price - b.price);
        setVouchers(sortedVouchers);
      } catch (err) {
        console.error('Error fetching vouchers:', err);
      } finally {
        setVouchersLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    { icon: '⚡', title: 'Super Cepat', desc: 'Kecepatan hingga 50 Mbps untuk streaming HD tanpa buffering' },
    { icon: '🛡️', title: 'Stabil & Aman', desc: 'Koneksi stabil 24/7 dengan keamanan jaringan terjamin' },
    { icon: '💰', title: 'Harga Terjangkau', desc: 'Paket internet berkualitas dengan harga yang bersahabat' },
    { icon: '🤖', title: 'WhatsApp Bot', desc: 'Kelola router sendiri via WhatsApp - ganti nama & password WiFi dengan mudah' },
    { icon: '🔧', title: 'Support 24/7', desc: 'Tim teknis siap membantu kapanpun Anda butuhkan' },
    { icon: '📡', title: 'Fiber Optik', desc: 'Teknologi fiber optik terbaru untuk performa maksimal' },
    { icon: '📹', title: 'CCTV Publik', desc: 'Akses CCTV publik gratis di beberapa lokasi strategis', link: 'https://cctv.raf.my.id' },
    { icon: '🚀', title: 'Tanpa FUP', desc: 'Internet unlimited tanpa batasan kuota, bebas browsing sepuasnya' },
    { icon: '⏱️', title: 'Pemasangan Cepat', desc: 'Proses instalasi cepat 1-3 hari kerja setelah survei lokasi' },
  ];

  const testimonials = [
    { name: 'Budi Santoso', role: 'Pemilik Warnet', text: 'Sejak pakai RAF NET, pelanggan warnet saya makin puas. Koneksi stabil dan cepat!', rating: 5 },
    { name: 'Siti Rahayu', role: 'Ibu Rumah Tangga', text: 'Anak-anak bisa belajar online dengan lancar. Harga juga sangat terjangkau.', rating: 5 },
    { name: 'Ahmad Wijaya', role: 'Freelancer', text: 'Upload file besar jadi cepat banget. Sangat membantu pekerjaan saya.', rating: 5 },
  ];

  const faqs = [
    { q: 'Berapa lama proses pemasangan?', a: 'Proses pemasangan biasanya selesai dalam 1-3 hari kerja setelah survei lokasi. Tim teknisi kami akan menghubungi Anda untuk jadwal pemasangan yang sesuai.' },
    { q: 'Bagaimana cara berlangganan?', a: 'Sangat mudah! Cukup klik tombol "Pilih Paket" pada paket yang Anda inginkan, lalu Anda akan terhubung langsung ke WhatsApp kami untuk proses pendaftaran.' },
    { q: 'Bagaimana jika terjadi gangguan?', a: 'Tim support kami siap 24/7. Hubungi via WhatsApp untuk respon cepat. Kami akan segera mengirim teknisi jika diperlukan perbaikan di lokasi.' },
    { q: 'Apakah ada batasan kuota (FUP)?', a: 'Tidak ada! Semua paket kami unlimited tanpa FUP. Anda bebas streaming, gaming, dan download sepuasnya tanpa khawatir kuota habis.' },
    { q: 'Area mana saja yang terjangkau?', a: 'Saat ini kami melayani Ds. Dander dan Ds. Tanjungharjo, Kec. Dander, Kab. Bojonegoro, Jawa Timur. Hubungi kami untuk cek ketersediaan di lokasi Anda.' },
    { q: 'Apa keunggulan WhatsApp Bot RAF NET?', a: 'Dengan WhatsApp Bot kami, Anda bisa mengatur router sendiri seperti mengganti nama WiFi dan password kapan saja tanpa perlu menghubungi teknisi.' },
  ];

  return (
    <div className="index-page">
      {/* Header */}
      <header className={`header ${isHeaderScrolled ? 'header-scrolled' : ''}`}>
        <div className="header-content">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <span className="logo-icon">📡</span>
              <span className="logo-pulse"></span>
            </div>
            <div className="logo-text-wrapper">
              <span className="logo-text">RAF NET</span>
              <span className="logo-tagline">Layanan Internet</span>
            </div>
          </div>
          
          <nav className={`header-nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
            <button className="nav-link" onClick={() => scrollToSection('features')}>Keunggulan</button>
            <button className="nav-link" onClick={() => scrollToSection('coverage')}>Jangkauan</button>
            <button className="nav-link" onClick={() => scrollToSection('packages')}>Paket</button>
            <button className="nav-link" onClick={() => scrollToSection('testimonials')}>Testimoni</button>
            <button className="nav-link" onClick={() => scrollToSection('faq')}>FAQ</button>
            <button className="nav-link" onClick={() => scrollToSection('contact')}>Kontak</button>
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
          </nav>

          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}></span>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-gradient"></div>
          <div className="hero-grid"></div>
          <div className="hero-glow hero-glow-1"></div>
          <div className="hero-glow hero-glow-2"></div>
          <div className="hero-particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{ 
                left: `${Math.random() * 100}%`, 
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${15 + Math.random() * 10}s`
              }}></div>
            ))}
          </div>
        </div>
        
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-line">Internet</span>
            <span className="hero-title-line hero-title-gradient">Super Cepat</span>
            <span className="hero-title-line">untuk Semua</span>
          </h1>
          
          <p className="hero-desc">
            Nikmati koneksi fiber optik berkecepatan tinggi dengan harga terjangkau. 
            Streaming, gaming, dan bekerja dari rumah tanpa hambatan.
          </p>
          
          <div className="hero-buttons">
            <button className="hero-btn hero-btn-primary" onClick={() => scrollToSection('packages')}>
              <span>Lihat Paket</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button className="hero-btn hero-btn-secondary" onClick={() => scrollToSection('contact')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>Hubungi Kami</span>
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="stat-number">500</span>
                <span className="stat-plus">+</span>
              </div>
              <div className="hero-stat-label">Pelanggan Aktif</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="stat-number">99.9</span>
                <span className="stat-percent">%</span>
              </div>
              <div className="hero-stat-label">Uptime Jaringan</div>
            </div>
            <div className="hero-stat-divider"></div>
            <div className="hero-stat">
              <div className="hero-stat-value">
                <span className="stat-number">24</span>
                <span className="stat-suffix">/7</span>
              </div>
              <div className="hero-stat-label">Customer Support</div>
            </div>
          </div>
        </div>
        
        <div className="hero-scroll-indicator" onClick={() => scrollToSection('features')}>
          <span>Scroll</span>
          <div className="scroll-arrow"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Mengapa Memilih Kami</span>
            <h2 className="section-title">Keunggulan RAF NET</h2>
            <p className="section-subtitle">
              Kami berkomitmen memberikan layanan internet terbaik untuk Anda
            </p>
          </div>
          
          <div className="features-grid">
            {features.map((feature, index) => {
              const CardContent = (
                <>
                  <div className="feature-icon-wrapper">
                    <span className="feature-icon">{feature.icon}</span>
                    <div className="feature-icon-bg"></div>
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-desc">{feature.desc}</p>
                  {feature.link && (
                    <span className="feature-link-indicator">
                      Kunjungi →
                    </span>
                  )}
                </>
              );
              
              return feature.link ? (
                <a 
                  key={index} 
                  href={feature.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="feature-card feature-card-link" 
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {CardContent}
                </a>
              ) : (
                <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  {CardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Coverage Section */}
      <section id="coverage" className="coverage-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Area Layanan</span>
            <h2 className="section-title">Jangkauan Kami</h2>
            <p className="section-subtitle">
              Jaringan fiber optik berkualitas tinggi di area berikut
            </p>
          </div>
          
          <div className="coverage-grid">
            <div className="coverage-card">
              <div className="coverage-card-inner">
                <div className="coverage-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
                <h3>Ds. Dander</h3>
                <p>Jangkauan penuh dengan jaringan fiber optik. Kecepatan hingga 50 Mbps tersedia di seluruh area desa.</p>
                <div className="coverage-features">
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> Fiber Optik</span>
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> 50 Mbps</span>
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> Full Coverage</span>
                </div>
                <div className="coverage-status">
                  <span className="status-dot"></span>
                  <span>Tersedia Sekarang</span>
                </div>
              </div>
            </div>
            
            <div className="coverage-card">
              <div className="coverage-card-inner">
                <div className="coverage-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
                <h3>Ds. Tanjungharjo</h3>
                <p>Jangkauan penuh dengan jaringan fiber optik. Kecepatan hingga 50 Mbps tersedia di seluruh area desa.</p>
                <div className="coverage-features">
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> Fiber Optik</span>
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> 50 Mbps</span>
                  <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20,6 9,17 4,12"/></svg> Full Coverage</span>
                </div>
                <div className="coverage-status">
                  <span className="status-dot"></span>
                  <span>Tersedia Sekarang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage Maps */}
          <div className="coverage-maps-section">
            <h3 className="coverage-map-title">Lokasi Area Layanan</h3>
            <div className="coverage-maps-grid">
              <div className="coverage-map-item">
                <h4>📍 Ds. Dander</h4>
                <div className="coverage-map">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7903.5!2d111.7950!3d-7.1650!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e77f8d5a5a5a5a5%3A0x1!2sDander%2C%20Kec.%20Dander%2C%20Kabupaten%20Bojonegoro%2C%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '0.75rem' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Desa Dander"
                  ></iframe>
                </div>
                <p className="coverage-map-note">Kec. Dander, Kab. Bojonegoro, Jawa Timur</p>
              </div>
              
              <div className="coverage-map-item">
                <h4>📍 Ds. Tanjungharjo</h4>
                <div className="coverage-map">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7903.5!2d111.8050!3d-7.1750!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e77f8d5b5b5b5b5%3A0x2!2sTanjungharjo%2C%20Kec.%20Dander%2C%20Kabupaten%20Bojonegoro%2C%20Jawa%20Timur!5e0!3m2!1sid!2sid!4v1"
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: '0.75rem' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Desa Tanjungharjo"
                  ></iframe>
                </div>
                <p className="coverage-map-note">Kec. Dander, Kab. Bojonegoro, Jawa Timur</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="packages-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Pilihan Paket</span>
            <h2 className="section-title">Paket Internet</h2>
            <p className="section-subtitle">
              Pilih paket yang sesuai dengan kebutuhan internet Anda
            </p>
          </div>
          
          {loading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Memuat paket...</p>
            </div>
          )}
          
          {error && (
            <div className="error-message">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>{error}</p>
            </div>
          )}
          
          {!loading && !error && packages.length === 0 && (
            <div className="no-packages">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
              <p>Belum ada paket tersedia saat ini.</p>
            </div>
          )}
          
          {!loading && !error && packages.length > 0 && (
            <div className="packages-grid">
              {packages.map((pkg, index) => (
                <PackageCard key={pkg.id} package={pkg} featured={index === Math.floor(packages.length / 2)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vouchers Section */}
      <section className="vouchers-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Harga Voucher</span>
            <h2 className="section-title">Voucher Internet</h2>
            <p className="section-subtitle">
              Butuh internet sementara? Beli voucher dengan durasi sesuai kebutuhan
            </p>
          </div>
          
          {vouchersLoading && (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Memuat voucher...</p>
            </div>
          )}
          
          {!vouchersLoading && vouchers.length === 0 && (
            <div className="no-packages">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
              <p>Belum ada voucher tersedia saat ini.</p>
            </div>
          )}
          
          {!vouchersLoading && vouchers.length > 0 && (
            <div className="vouchers-grid">
              {vouchers.map((voucher) => {
                const voucherMessage = `Hai Admin RAF NET, saya ingin beli voucher ${voucher.duration} seharga Rp ${new Intl.NumberFormat('id-ID').format(voucher.price)}.`;
                const voucherWhatsAppUrl = `https://wa.me/6289685645956?text=${encodeURIComponent(voucherMessage)}`;
                
                return (
                  <div key={voucher.id} className="voucher-card">
                    <div className="voucher-duration">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                      </svg>
                      <span>{voucher.duration}</span>
                    </div>
                    <div className="voucher-price">
                      <span className="voucher-currency">Rp</span>
                      <span className="voucher-value">{new Intl.NumberFormat('id-ID').format(voucher.price)}</span>
                    </div>
                    <a 
                      href={voucherWhatsAppUrl}
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="voucher-btn"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      <span>Beli via WhatsApp</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="testimonials-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Testimoni</span>
            <h2 className="section-title">Apa Kata Mereka</h2>
            <p className="section-subtitle">
              Pengalaman pelanggan yang telah menggunakan layanan kami
            </p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="star">★</span>
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="author-info">
                    <span className="author-name">{testimonial.name}</span>
                    <span className="author-role">{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">FAQ</span>
            <h2 className="section-title">Pertanyaan Umum</h2>
            <p className="section-subtitle">
              Temukan jawaban untuk pertanyaan yang sering diajukan
            </p>
          </div>
          
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFaq === index ? 'faq-active' : ''}`}
                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
              >
                <div className="faq-question">
                  <span>{faq.q}</span>
                  <div className="faq-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                </div>
                <div className="faq-answer">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg">
          <div className="cta-gradient"></div>
        </div>
        <div className="section-content">
          <div className="cta-content">
            <h2>Siap Merasakan Internet Super Cepat?</h2>
            <p>Hubungi kami sekarang dan dapatkan penawaran terbaik untuk kebutuhan internet Anda.</p>
            <div className="cta-buttons">
              <a href="https://wa.me/6289685645956" target="_blank" rel="noopener noreferrer" className="cta-btn cta-btn-whatsapp">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span>Chat WhatsApp</span>
              </a>
              <button className="cta-btn cta-btn-call" onClick={() => scrollToSection('contact')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                <span>Lihat Kontak</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="section-content">
          <div className="section-header">
            <span className="section-badge">Hubungi Kami</span>
            <h2 className="section-title">Kontak</h2>
            <p className="section-subtitle">
              Butuh bantuan atau ingin berlangganan? Hubungi kami sekarang
            </p>
          </div>
          
          <div className="contact-grid contact-grid-3">
            <a href="https://wa.me/6289685645956" target="_blank" rel="noopener noreferrer" className="contact-card contact-card-whatsapp">
              <div className="contact-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <h3>WhatsApp</h3>
              <p>0896-8564-5956</p>
            </a>
            
            <div className="contact-card">
              <div className="contact-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h3>Email</h3>
              <p>-</p>
            </div>
            
            <div className="contact-card">
              <div className="contact-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h3>Alamat</h3>
              <p>Bojonegoro, Jawa Timur</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-icon">📡</span>
                <span className="footer-logo-text">RAF NET</span>
              </div>
              <p className="footer-desc">
                Penyedia layanan internet terpercaya untuk area Dander dan Tanjungharjo, Bojonegoro.
              </p>
            </div>
            
            <div className="footer-links-group">
              <h4>Navigasi</h4>
              <button onClick={() => scrollToSection('features')}>Keunggulan</button>
              <button onClick={() => scrollToSection('packages')}>Paket Internet</button>
              <button onClick={() => scrollToSection('coverage')}>Area Layanan</button>
              <button onClick={() => scrollToSection('contact')}>Kontak</button>
            </div>
            
            <div className="footer-links-group">
              <h4>Kontak</h4>
              <a href="https://wa.me/6289685645956" target="_blank" rel="noopener noreferrer">WhatsApp: 0896-8564-5956</a>
              <span>Email: -</span>
              <span>Bojonegoro, Jawa Timur</span>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} RAF NET. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default IndexPage;
