'use client';

export function KvbLogo({ variant = 'horizontal', size = 'md', className = '', logoFile = 'KVB Logo' }) {
  const sizeClasses = {
    sm: { icon: 40, text: 'text-base' },
    md: { icon: 60, text: 'text-lg' },
    lg: { icon: 76, text: 'text-xl' },
    xl: { icon: 96, text: 'text-2xl' },
  };
  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`kvb-logo ${variant} ${className}`} role="img" aria-label="Kenya Veterinary Board">
      <div className="kvb-logo-elements" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.9rem' }}>
        <div
          className="kvb-logo-badge"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: s.icon,
            height: s.icon,
          }}
        >
          <img
            src={`/assets/${logoFile}.jpg`}
            alt="Kenya Veterinary Board"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
        <div className="kvb-logo-text">
          <span
            className={s.text}
            style={{
              fontWeight: 700,
              color: '#102a43',
              letterSpacing: '0.03em',
            }}
          >
            KENYA VETERINARY BOARD
          </span>
          <div
            className="kvb-logo-badge"
            style={{
              marginTop: '2px',
              fontSize: '0.76rem',
              fontWeight: 500,
              color: '#0f5132',
            }}
          >
            Veterinary Inspection Portal
          </div>
        </div>
      </div>
    </div>
  );
}

export function KvbLogoSmall({ size = 48, className = '', logoFile = 'KVB Logo' }) {
  return (
    <div className={`kvb-logo-small ${className}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <div
        className="kvb-logo-badge-small"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          borderRadius: '24px',
          overflow: 'hidden',
        }}
      >
        <img
          src={`/assets/${logoFile}.jpg`}
          alt="Kenya Veterinary Board"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}

export default KvbLogo;
