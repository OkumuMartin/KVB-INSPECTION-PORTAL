'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { KvbLogoSmall } from '../components/KvbLogo';
import ThemeToggle from '../components/ThemeToggle';
import { useReveal } from '../hooks/useReveal';
import '../styles/LandingPage.css';

const trustStats = [
  { value: '12', label: 'Counties Covered' },
  { value: '847', label: 'Inspections Completed' },
  { value: '97%', label: 'Compliance Rate' },
  { value: '29', label: 'Licensed Services' },
];

const services = [
  { icon: 'fa-clipboard-check', title: 'Outlet Inspection', desc: 'On-site assessment of veterinary inputs outlets against regulatory standards.', iconClass: 'lp-fi-green' },
  { icon: 'fa-file-pdf', title: 'Certification', desc: 'Generate official KVB inspection certificates and compliance reports.', iconClass: 'lp-fi-navy' },
  { icon: 'fa-chart-line', title: 'Analytics', desc: 'Track compliance metrics and trends across all inspected outlets.', iconClass: 'lp-fi-gold' },
  { icon: 'fa-user-shield', title: 'RBAC', desc: 'Role-based access control for Inspectors, Directors, and CEO/Registrar.', iconClass: 'lp-fi-green' },
  { icon: 'fa-clock', title: 'Audit Trail', desc: 'Complete immutable log of every action with timestamps and user attribution.', iconClass: 'lp-fi-navy' },
  { icon: 'fa-lock', title: 'Secure Access', desc: 'JWT-based authentication with HTTP-only cookies and rate limiting.', iconClass: 'lp-fi-gold' },
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

/* The Board's own sites. Every service that is not run by this portal
   hands over to the relevant Board system. */
const KVB_MAIN_SITE = 'https://kenyavetboard.or.ke/en';
const KVB_PMS_LOGIN = 'https://mms.kenyavetboard.or.ke/site/login/';

type BoardService = {
  icon: string;
  badge: string;
  title: string;
  desc: string;
  link: string;
  cta: string;
  external: boolean;
};

const kvbServices: BoardService[] = [
  {
    icon: 'fa-user-plus',
    badge: 'Registration',
    title: 'Register as a Professional',
    desc: 'Register veterinary surgeons and veterinary paraprofessionals with the Board and keep every credential current and verifiable.',
    link: KVB_PMS_LOGIN,
    cta: 'Start a registration',
    external: true,
  },
  {
    icon: 'fa-file-invoice',
    badge: 'Licensing',
    title: 'Professional Licences',
    desc: 'Apply for and renew professional licences through a single workflow, with clear status tracking at every stage of the approval cycle.',
    link: KVB_PMS_LOGIN,
    cta: 'Manage licenses',
    external: true,
  },
  {
    icon: 'fa-clipboard-check',
    badge: 'Inspection',
    title: 'Outlet Inspection',
    desc: 'Conduct on-site inspections of veterinary inputs outlets, record findings against the KVB questionnaire, and track compliance to final certification.',
    link: '/login',
    cta: 'Open the portal',
    external: false,
  },
  {
    icon: 'fa-graduation-cap',
    badge: 'Education',
    title: 'Veterinary Education Standards',
    desc: 'Access the standards and accreditation guidance that underpin veterinary training in Kenya, from continuing education to internship programme rules.',
    link: 'https://kenyavetboard.or.ke/en/registration/registration',
    cta: 'View the standards',
    external: true,
  },
  {
    icon: 'fa-download',
    badge: 'Downloads',
    title: 'Forms, Guidelines and Publications',
    desc: 'Download the official inspection forms, practice guidelines and Board publications used across the profession.',
    link: 'https://kenyavetboard.or.ke/en/downloads/forms',
    cta: 'Browse downloads',
    external: true,
  },
  {
    icon: 'fa-envelope',
    badge: 'Enquiries',
    title: 'Contact Us and File Complaints',
    desc: 'Reach the Board for enquiries, complaints and service requests, and follow the status of everything you raise with us.',
    link: 'https://kenyavetboard.or.ke/en/contact',
    cta: 'Make an enquiry',
    external: true,
  },
];

const noticeItems = [
  { text: 'Tender Notice - Site Visit', link: KVB_MAIN_SITE },
  { text: 'Launch of 2026 Veterinary Internship Programme', link: KVB_MAIN_SITE },
  { text: 'Veterinary Internship Guidelines', link: KVB_MAIN_SITE },
  { text: 'Election of Board Members', link: KVB_MAIN_SITE },
  { text: 'Retention Payment Options 2026', link: KVB_MAIN_SITE },
  { text: 'KVB Portal Account Activation Guide', link: KVB_MAIN_SITE },
];

function LogoPill() {
  return (
    <div className="kvb-logo-pill kvb-logo-pill--hero">
      <KvbLogoSmall size={80} />
      <div>
        <div className="kvb-logo-pill-text-main">KENYA VETERINARY BOARD</div>
        <div className="kvb-logo-pill-text-sub">Veterinary Inspection Portal</div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc, iconClass, index = 0 }: { icon?: React.ReactNode; title: string; desc: string; iconClass?: string; index?: number }) {
  return (
    <div className="kvb-feature-card" style={{ transitionDelay: `${index * 70}ms` }}>
      <div className={`kvb-feature-icon ${iconClass}`}>{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}

function WorkflowStep({ number, title, desc }: { number: string; title: string; desc: string }) {
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

/**
 * A single Board service card, laid out like the services grid on the Board's
 * management system: an icon block on the left, the service category and its
 * online status on the right, and the call to action on the footer row.
 */
function ServiceCard({ service, index = 0 }: { service: BoardService; index?: number }) {
  const action = service.external ? (
    <a href={service.link} className="kvb-service-button" target="_blank" rel="noopener noreferrer">
      <span>{service.cta}</span>
      <i className="fa fa-arrow-right"></i>
    </a>
  ) : (
    <Link href={service.link} className="kvb-service-button">
      <span>{service.cta}</span>
      <i className="fa fa-arrow-right"></i>
    </Link>
  );

  return (
    <div className="kvb-service-card" style={{ transitionDelay: `${index * 70}ms` }}>
      <div className="kvb-service-card-header">
        <div className="kvb-service-icon-wrap">
          <i className={`fa ${service.icon}`}></i>
        </div>
        <div className="kvb-service-badges">
          <div className="kvb-service-badge-main">{service.badge}</div>
          <div className="kvb-service-badge-status">
            <i className="fa fa-circle"></i>
            Available online
          </div>
        </div>
      </div>

      <h3 className="kvb-service-card-title">{service.title}</h3>
      <p className="kvb-service-card-desc">{service.desc}</p>

      <div className="kvb-service-card-footer">
        <span className="kvb-service-meta-pill">
          <i className="fa fa-circle-info"></i>
          Regulated by Kenya Veterinary Board
        </span>
        {action}
      </div>
    </div>
  );
}

/** A section that fades and lifts into place the first time it is scrolled to. */
function RevealSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`lp-reveal ${visible ? 'is-visible' : ''} ${className}`}>
      {children}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [mounted] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="lp-shell">
      <div className="kvb-bg-blob kvb-blob-1"></div>
      <div className="kvb-bg-blob kvb-blob-2"></div>
      <div className="kvb-bg-blob kvb-blob-3"></div>

      <header className={`lp-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-header-full">
          <div className="lp-header-left">
            <button
              type="button"
              className="lp-header-logo"
              onClick={() => window.location.reload()}
              aria-label="Kenya Veterinary Board - Home"
            >
              <KvbLogoSmall size={120} />
              <div className="header-brand">
                <span className="header-brand-name">Kenya Veterinary Board</span>
                <span className="header-tagline">Upholding Veterinary Standards</span>
              </div>
            </button>
          </div>
          <nav className="lp-header-nav">
            <a href="#services">Services</a>
            <a href="#inspection">Inspection</a>
            <a href="#features">Features</a>
            <a href="#workflow">Workflow</a>
            <a href="#contact">Contact</a>
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard" className="btn btn-secondary lp-signin-btn">
                <i className="fa fa-tachometer-alt"></i> Dashboard
              </Link>
            ) : (
              <Link href="/login" className="btn btn-primary lp-signin-btn">
                <i className="fa fa-sign-in-alt"></i> Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className={`lp-main ${mounted ? 'lp-fade-in' : ''}`}>
        <section className="lp-hero">
          <div className="lp-container">
            <div className="kvb-hero-card">
              <div className="kvb-hero-left">
                <LogoPill />

                <div className="kvb-hero-text">
                  <h1 className="kvb-hero-title">Veterinary Inspection Portal</h1>
                  <p className="kvb-hero-sub">
                    A secure digital platform for managing veterinary inputs outlet inspections,
                    streamlining the regulatory workflow from on-site assessment to final approval.
                  </p>
                </div>

                <div className="lp-hero-actions">
                  <Link href="/login" className="btn btn-primary lp-btn-xl">
                    <i className="fa fa-sign-in-alt"></i> Access the Portal
                  </Link>
                  <Link href="#features" className="btn btn-secondary lp-btn-xl">
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
                        <span className="lp-progress-step lp-progress-active">1</span>
                        <span className="lp-progress-step">2</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-noticeboard">
          <div className="lp-container">
            <div className="kvb-notice-ticker">
              <span className="kvb-notice-label">
                <i className="fa fa-bullhorn"></i> Notice Board
              </span>
              <div className="kvb-notice-list">
                <div className="kvb-ticker-items">
                  {noticeItems.map((item) => (
                    <span key={item.text}>
                      <a href={item.link} target="_blank" rel="noopener noreferrer">{item.text}</a>
                    </span>
                  ))}
                  {noticeItems.map((item) => (
                    <span key={item.text + '-dup'}>
                      <a href={item.link} target="_blank" rel="noopener noreferrer">{item.text}</a>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

          <section id="services" className="lp-services">
            <div className="lp-container">
              <RevealSection>
                <div className="kvb-section-header">
                  <p className="kvb-eyebrow">Our Services</p>
                  <h2 className="kvb-section-title">Veterinary Regulatory Services</h2>
                  <p className="kvb-section-sub">
                    The Kenya Veterinary Board provides a comprehensive range of services to uphold veterinary
                    standards and ensure quality across the veterinary profession in Kenya.
                  </p>
                </div>
              </RevealSection>

              <RevealSection>
                <div className="kvb-service-grid">
                  {kvbServices.map((service, index) => (
                    <ServiceCard key={service.title} service={service} index={index} />
                  ))}
                </div>
              </RevealSection>
            </div>
          </section>

        <section id="inspection" className="lp-about">
          <div className="lp-container">
            <RevealSection>
              <div className="kvb-about-card">
                <div className="kvb-about-badge">
                  <i className="fa fa-gavel"></i> About KVB
                </div>
                 <h2 className="kvb-section-title">Regulatory Oversight of Veterinary Inputs</h2>
                <p className="kvb-about-text">
                  The Kenya Veterinary Board exercises statutory supervision over the training, business,
                  practice and employment of veterinary surgeons and veterinary paraprofessionals in Kenya,
                  as mandated by the Veterinary Surgeons' and Veterinary Para-professionals Act No. 29 of 2011.
                </p>
                <p className="kvb-about-sub">
                  Through its Inspection Portal, KVB monitors veterinary input outlets across all 47 counties, ensuring products
                  meet safety standards, prescriptions are maintained, and regulatory compliance is upheld — protecting animal and
                  public health through rigorous on-site assessments and digital reporting.
                </p>
              </div>
            </RevealSection>
          </div>
        </section>

        <section className="lp-mandate">
          <div className="lp-container">
            <RevealSection>
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
                  <span className="kvb-tag">Regulatory Excellence</span>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

<section id="features" className="lp-features">
            <div className="lp-container">
              <RevealSection>
                <div className="kvb-section-header">
                  <p className="kvb-eyebrow">Platform Features</p>
                  <h2 className="kvb-section-title">Built for regulatory excellence</h2>
                  <p className="kvb-section-sub">
                    Designed to meet the rigorous standards of the Kenya Veterinary Board's inspection mandate,
                    ensuring compliance, traceability, and efficiency across every stage of the inspection lifecycle.
                  </p>
                </div>
              </RevealSection>

              <RevealSection>
                <div className="kvb-feature-grid">
                  {services.map((f, index) => (
                    <FeatureCard
                      key={f.title}
                      icon={<i className={`fa ${f.icon}`}></i>}
                      title={f.title}
                      desc={f.desc}
                      iconClass={f.iconClass || 'lp-fi-green'}
                      index={index}
                    />
                  ))}
                </div>
              </RevealSection>
            </div>
          </section>

<section id="workflow" className="lp-workflow-section">
            <div className="lp-container">
              <RevealSection>
                <div className="kvb-section-header">
                  <p className="kvb-eyebrow">Inspection Lifecycle</p>
                  <h2 className="kvb-section-title">Three-stage approval process</h2>
                  <p className="kvb-section-sub">
                    Every inspection follows a structured workflow to ensure quality and accountability
                    at every checkpoint.
                  </p>
                </div>
              </RevealSection>

              <RevealSection>
                <div className="kvb-workflow-steps">
                  {workflowSteps.map((step, idx) => (
                    <React.Fragment key={step.number}>
                      {idx > 0 && <div className="kvb-workflow-arrow"><i className="fa fa-arrow-right"></i></div>}
                      <WorkflowStep
                        number={step.number}
                        title={step.title}
                        desc={step.desc}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </RevealSection>
            </div>
          </section>

<section className="lp-security">
            <div className="lp-container">
              <RevealSection>
                <div className="kvb-section-header">
                  <p className="kvb-eyebrow">Enterprise Security</p>
                  <h2 className="kvb-section-title">Built with regulatory compliance in mind</h2>
                  <p className="kvb-section-sub">
                    Enterprise-grade security measures protect sensitive inspection data and ensure
                    full compliance with Kenyan regulatory requirements.
                  </p>
                </div>
              </RevealSection>

              <RevealSection>
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
              </RevealSection>
            </div>
          </section>
      </main>

<footer id="contact" className="lp-footer">
            <div className="lp-container">
              <div className="kvb-footer-row">
                <div className="kvb-footer-widget">
                  <div className="kvb-footer-brand">
                    <div className="kvb-footer-logo">
                      <KvbLogoSmall size={80} logoFile="KVB Logo 1" />
                      <div>
                        <div className="kvb-brand-title">Kenya Veterinary Board</div>
                        <div className="kvb-brand-subtitle">Upholding Veterinary Standards</div>
                      </div>
                    </div>
                    <div className="kvb-footer-tagline">
                      Veterinary Inspection Portal — a digital gateway for managing veterinary inputs outlet inspections across Kenya.
                    </div>
                    <div className="kvb-footer-contact">
                      <span><i className="fa fa-phone"></i> Tel: +254-722 305 253</span>
                      <span><i className="fa fa-mobile-alt"></i> +254-701 581 718</span>
                      <span><i className="fa fa-envelope"></i> info@kenyavetboard.or.ke</span>
                      <span><i className="fa fa-map-marker-alt"></i> P.O. Box 513 – 00605, Uthiru, Nairobi</span>
                    </div>
                  </div>
                </div>

                <div className="kvb-footer-widget">
                  <div className="kvb-footer-col">
                    <strong>Quick Links</strong>
                    <ul>
                      <li><Link href="/">Home</Link></li>
                      <li><a href={KVB_PMS_LOGIN} target="_blank" rel="noopener noreferrer">KVB PMS</a></li>
                      <li><Link href="/login">Inspection Portal</Link></li>
                      <li><a href={KVB_MAIN_SITE} target="_blank" rel="noopener noreferrer">Notices</a></li>
                    </ul>
                  </div>
                </div>

                <div className="kvb-footer-widget">
                  <div className="kvb-footer-col">
                    <strong>Services</strong>
                    <ul>
                      <li><a href="#services">Outlet Inspection</a></li>
                      <li><a href="#features">Compliance Monitoring</a></li>
                      <li><a href="#features">Report Generation</a></li>
                      <li><Link href="/login">Dashboard</Link></li>
                    </ul>
                  </div>
                </div>

                <div className="kvb-footer-widget">
                  <div className="kvb-footer-col">
                    <strong>Support</strong>
                    <ul>
                      <li><a href="https://kenyavetboard.or.ke/en/contact" target="_blank" rel="noopener noreferrer">Make an Enquiry</a></li>
                      <li><a href="https://kenyavetboard.or.ke/en/contact" target="_blank" rel="noopener noreferrer">File a Complaint</a></li>
                      <li><a href="https://kenyavetboard.or.ke/en/contact" target="_blank" rel="noopener noreferrer">Contact Us</a></li>
                      <li><a href="https://kenyavetboard.or.ke/en/faq" target="_blank" rel="noopener noreferrer">FAQ</a></li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="kvb-footer-bottom">
                <div className="kvb-footer-copyright">
                  <span>&copy; 2026 Kenya Veterinary Board. All rights reserved.</span>
                </div>
              </div>
            </div>
          </footer>
        </div>

        <button
          type="button"
          className={`lp-scroll-top ${showScrollTop ? 'show' : ''}`}
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <i className="fa fa-arrow-up"></i>
        </button>
      </>
  );
}
