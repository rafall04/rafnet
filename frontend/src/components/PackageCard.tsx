import { Package } from '../api/types';
import './PackageCard.css';

interface PackageCardProps {
  package: Package;
  featured?: boolean;
}

/**
 * Package Card Component
 * Premium design with red-black theme
 * Requirements: 1.3, 1.5
 */
function PackageCard({ package: pkg, featured = false }: PackageCardProps) {
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('id-ID', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleContact = () => {
    const message = `Hai Admin RAF NET, saya ingin pasang wifi paket ${pkg.name} (${pkg.speed}) seharga Rp ${formatPrice(pkg.price)}/bulan.`;
    window.open(`https://wa.me/6289685645956?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className={`package-card ${featured ? 'package-card-featured' : ''}`}>
      {featured && (
        <div className="package-badge">
          <span className="badge-star">★</span>
          <span>POPULER</span>
        </div>
      )}
      
      <div className="package-header">
        <div className="package-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
          </svg>
        </div>
        <h3 className="package-name">{pkg.name}</h3>
      </div>
      
      <div className="package-speed">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
        </svg>
        <span>{pkg.speed}</span>
      </div>
      
      <div className="package-price">
        <span className="price-currency">Rp</span>
        <span className="price-value">{formatPrice(pkg.price)}</span>
        <span className="price-period">/bulan</span>
      </div>
      
      {pkg.description && (
        <p className="package-description">{pkg.description}</p>
      )}
      
      <div className="package-features">
        <div className="feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>Unlimited Kuota</span>
        </div>
        <div className="feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>Tanpa FUP</span>
        </div>
        <div className="feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>Support 24/7</span>
        </div>
        <div className="feature">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          <span>Gratis Instalasi</span>
        </div>
      </div>
      
      <button className="package-cta" onClick={handleContact}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span>Hubungi via WhatsApp</span>
      </button>
    </div>
  );
}

export default PackageCard;
