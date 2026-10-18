import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import kvbLogo from '../assets/KVB Logo.jpg';
import './LandingPage.css';

const trustStats = [
  { value: '12', label: 'Counties' },
  { value: '847', label: 'Inspections Completed' },
  { value: '97%', label: 'Compliance Rate' },
  { value: '29', label: 'Licensed Services' },
];

const services = [
  { icon: 'fa-clipboard-check', title: 'Outlet Inspection', desc: 'On-site assessment of veterinary inputs outlets against regulatory standards.' },
  { icon: 'fa-file-pdf', title: 'Certification', desc: 'Generate official KVB inspection certificates and compliance reports.' },
  { icon: 'fa-chart-line', title: 'Analytics', desc: 'Track compliance metrics and trends across all inspected outlets.' },
  { icon: 'fa-user-shield', title: 'RBAC', desc: 'Role-based access control for Inspectors, Directors, and CEO/Registrar.' },
  { icon: 'fa-clock', title: 'Audit Trail', desc: 'Complete immutable log of every action with timestamps and user attribution.' },
  { icon: 'fa-lock', title: 'Secure Access', desc: 'JWT-based authentication with HTTP-only cookies and rate limiting.' },
];

const workflowSteps = [
  { number: '1', title: 'Draft & Submit', desc: 'Inspectors create and submit outlet inspection reports with supporting evidence.' },
  { number: '2', title: 'Director Review', desc: 'The Director reviews submissions, can approve or return items for correction.' },
  { number: '3', title: 'CEO/Registrar Sign-off', desc: 'The CEO/Registrar performs final approval, generating official certification.' },
];

const securityFeatures = [
  { icon: 'fa-shield-alt', title: 'End-to-End Encryption', desc: 'All data transmitted and stored with industry-standard encryption.' },
  { icon: 'fa-key', title: 'Secure Authentication', desc: 'JWT tokens in HTTP-only cookies with role-based access control.' },
  { icon: 'fa-user-lock', title: 'Audit Logging', desc: 'Every action logged with immutable timestamps for regulatory compliance.' },
];

const footerColumns = [
  {
    title: 'Quick Links',
    links: [
      { label: 'Login', to: '/login' },
      { label: 'Inspection Portal', to: '/login' },
    ],
  },
  {
    title: 'Contact',
    items: [
      { icon: 'fa-phone', text: '+254-722 305 253' },
      { icon: 'fa-mobile-alt', text: '+254-701 581 718' },
      { icon: 'fa-envelope', text: 'info@kenyavetboard.or.ke' },
    ],
  },
  {
    title: 'Address',
    items: [
      { icon: 'fa-map-marker-alt', text: 'P.O. Box 513 – 00605, Uthiru, Nairobi' },
    ],
  },
];

function LogoIcon({ size = 46 }) {
  return (
    <div
      className="lp-logo-icon"
      style={{ width: size, height: size }}
      role="img"
      aria-label="Kenya Veterinary Board logo"
    >
      <img src={kvbLogo} alt="Kenya Veterinary Board" />
    </div>
  );
}

function LogoPill({ variant = 'default' }) {
  const classes = `kvb-logo-pill kvb-logo-pill--${variant}`;
  return (
    <div className={classes}>
      <LogoIcon size={52} />
      <div>
        <div className="kvb-logo-pill-text-main">KENYA VETERINARY BOARD</div>
        <div className="kvb-logo-pill-text-sub">Inspection Management System</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, iconClass }) {
  return (
    <div className="kvb-feature-card">
      <div className={`kvb-feature-icon ${iconClass}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function WorkflowStep({ number, title, desc }) {
  return (
    <div className="kvb-workflow-step">
      <div className="kvb-step-number">
        <span>{number}</span>
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="lp-shell">
      <div className="kvb-bg-blob kvb-blob-1"></div>
      <div className="kvb-bg-blob kvb-blob-2"></div>
      <div className="kvb-bg-blob kvb-blob-3"></div>

      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container">
          <div className="lp-header-left">
            <LogoIcon size={46} />
          </div>
          {user ? (
            <Link to="/dashboard" className="btn btn-ghost">
              <i className="fa fa-tachometer-alt"></i> Dashboard
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary lp-signin-btn">
              <i className="fa fa-sign-in-alt"></i> Sign In
            </Link>
          )}
        </div>
      </header>

      <main className={`lp-main ${mounted ? 'lp-fade-in' : ''}`}>
        {/* ===== Hero Section ===== */}
        <section className="lp-hero">
          <div className="lp-container">
            <div className="kvb-hero-card">
              <div className="kvb-hero-left">
                <LogoPill variant="hero" />

                <div className="kvb-hero-text">
                  <h1 className="kvb-hero-title">Veterinary Inspection Portal</h1>
                  <p className="kvb-hero-sub">
                    A secure digital platform for managing veterinary inputs outlet inspections,
                    streamlining the regulatory workflow from on-site assessment to final approval.
                  </p>
                </div>

                <div className="lp-hero-actions">
                  <Link to="/login" className="btn btn-primary lp-btn-xl">
                    <i className="fa fa-sign-in-alt"></i> Access the Portal
                  </Link>
                  <Link to="#features" className="btn btn-ghost lp-btn-xl">
                    <i className="fa fa-info-circle"></i> Learn More
                  </Link>
                </div>

                <div className="lp-trust-bar">
                  {trustStats.map((stat) => (
                    <div key={stat.label} className="lp-trust-item">
                      <strong>{stat.value}</strong>
                      <span>{stat.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="kvb-hero-right">
                <div className="lp-demo-showcase">
                  <div className="lp-demo-card">
                    <div className="lp-demo-header">
                      <span className="lp-status-dot lp-status-submitted"></span>
                      <span>Submitted</span>
                    </div>
                    <div className="lp-demo-body">
                      <div className="lp-demo-title">Inspection #VIP-2026-0042</div>
                      <p>Pep Stores Ltd — Nairobi</p>
                      <div className="lp-demo-progress">
                        <span className="lp-progress-step lp-progress-complete">✓</span>
                        <span className="lp-progress-step lp-progress-complete">✓</span>
                        <span className="lp-progress-step">1</span>
                        <span className="lp-progress-step">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Mandate Section ===== */}
        <section className="lp-mandate">
          <div className="lp-container">
            <div className="kvb-mandate-card">
              <div className="kvb-mandate-header">
                <div className="kvb-badge">Board Charter</div>
                <h2 className="kvb-section-title">Our Mandate</h2>
              </div>
              <blockquote className="kvb-mandate-text">
                To exercise general supervision and control over the training, business, practice
                and employment of veterinary surgeons and veterinary paraprofessionals in Kenya.
                <cite> — Veterinary Surgeons' and Veterinary Para-professionals Act No. 29 of 2011</cite>
              </blockquote>
              <div className="kvb-tags">
                <span className="kvb-tag">Licensed Outlets</span>
                <span className="kvb-tag">National Reach</span>
                <span className="kvb-tag">Full Traceability</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Features Section ===== */}
        <section id="features" className="lp-features">
          <div className="lp-container">
            <div className="kvb-section-header">
              <p className="kvb-eyebrow">Platform Features</p>
              <h2 className="kvb-section-title">Built for regulatory excellence</h2>
              <p className="kvb-section-sub">
                Designed to meet the rigorous standards of the Kenya Veterinary Board's inspection mandate,
                ensuring compliance, traceability, and efficiency across every stage of the inspection lifecycle.
              </p>
            </div>

            <div className="kvb-feature-grid">
              {services.map((f) => (
                <FeatureCard
                  key={f.title}
                  icon={<i className={`fa ${f.icon}`}></i>}
                  title={f.title}
                  desc={f.desc}
                  iconClass={f.iconClass || 'lp-fi-green'}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ===== Workflow Section ===== */}
        <section className="lp-workflow-section">
          <div className="lp-container">
            <div className="kvb-section-header">
              <p className="kvb-eyebrow">Inspection Lifecycle</p>
              <h2 className="kvb-section-title">Three-stage approval process</h2>
              <p className="kvb-section-sub">
                Every inspection follows a structured workflow to ensure quality and accountability
                at every checkpoint.
              </p>
            </div>

            <div className="kvb-workflow-steps">
              {workflowSteps.map((step, idx) => (
                <>
                  {idx > 0 && <div className="kvb-workflow-arrow"><i className="fa fa-arrow-right"></i></div>}
                  <WorkflowStep
                    key={step.number}
                    number={step.number}
                    title={step.title}
                    desc={step.desc}
                  />
                </>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Security Section ===== */}
        <section className="lp-security">
          <div className="lp-container">
            <div className="kvb-section-header">
              <p className="kvb-eyebrow">Enterprise Security</p>
              <h2 className="kvb-section-title">Built with regulatory compliance in mind</h2>
              <p className="kvb-section-sub">
                Enterprise-grade security measures protect sensitive inspection data and ensure
                full compliance with Kenyan regulatory requirements.
              </p>
            </div>

            <div className="kvb-security-grid">
              {securityFeatures.map((feat) => (
                <div key={feat.title} className="kvb-security-card">
                  <div className="kvb-security-icon">
                    <i className={`fa ${feat.icon}`}></i>
                  </div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="kvb-footer-brand">
              <LogoIcon size={56} />
              <div>
                <div className="kvb-brand-title">Kenya Veterinary Board</div>
                <div className="kvb-brand-subtitle">Upholding Veterinary Standards</div>
              </div>
            </div>

            <div className="kvb-footer-links">
              {footerColumns.map((col) => (
                <div key={col.title} className="kvb-footer-col">
                  <strong>{col.title}</strong>
                  {col.links?.map((link) => (
                    <Link key={link.label} to={link.to}>{link.label}</Link>
                  ))}
                  {col.items?.map((item, i) => (
                    <span key={i}><i className={`fa ${item.icon}`}></i> {item.text}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="kvb-footer-bottom">
            <span>© 2026 Kenya Veterinary Board. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
