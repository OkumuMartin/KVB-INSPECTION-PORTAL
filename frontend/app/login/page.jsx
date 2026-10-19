'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { KvbLogoSmall } from '../../components/KvbLogo';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;
    const dateEl = document.querySelector('.kvb-date-text');
    if (dateEl) dateEl.textContent = dateStr;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
  };

  return (
    <>
      <style>{`
        /* Override stale cached CSS backdrop-filter blur */
        .kvb-auth-card, .kvb-logo-pill, .kvb-services-grid, .kvb-left-footer span {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        .kvb-logo-pill-text-main { color: #ffffff !important; }
        .kvb-logo-pill-text-sub { color: rgba(255,255,255,0.85) !important; }

        /* ===== Login page — two-panel side-by-side design ===== */
        .kvb-auth-shell {
          width: 100%;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1rem;
          box-sizing: border-box;
          overflow: hidden;
        }

        .kvb-auth-card {
          display: flex;
          flex-direction: row;
          width: 100%;
          max-width: 1100px;
          min-height: 600px;
          background: #ffffff;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(15, 23, 42, 0.25);
          position: relative;
        }

        .kvb-left,
        .kvb-right {
          padding: 2rem;
          box-sizing: border-box;
        }

        .kvb-right {
          position: relative;
        }

        .kvb-left {
          flex: 1;
          min-width: 0;
          background: linear-gradient(135deg, var(--kvb-green-dark) 0%, var(--kvb-green) 50%, var(--kvb-navy) 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .kvb-right {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        /* Branded service icon colors — KVB palette only (green, gold, navy, red/maroon) */
        .kvb-service-icon-shield {
          background: linear-gradient(135deg, var(--kvb-navy), var(--kvb-green-dark)) !important;
          color: #ffffff !important;
        }
        .kvb-service-icon-red-blend {
          background: linear-gradient(135deg, var(--kvb-red), var(--kvb-red-dark)) !important;
          color: #ffffff !important;
        }

        @media (max-width: 1024px) {
          .kvb-auth-card {
            flex-direction: column !important;
            max-width: 100%;
            min-height: auto;
          }

          .kvb-left {
            display: none !important;
          }

          .kvb-right {
            padding: 1.5rem;
          }

          .kvb-back-home,
          .kvb-date-pill {
            position: static !important;
            display: inline-block;
            width: auto;
            margin-bottom: 1rem;
            text-align: left;
          }

          .kvb-date-pill {
            margin-top: 0;
            margin-bottom: 0.75rem;
          }

          .kvb-pms-blob {
            display: none !important;
          }
        }

        @media (max-width: 768px) {
          .kvb-auth-shell {
            padding: 0.5rem;
          }

          .kvb-auth-card {
            max-width: 100%;
            min-height: auto;
            border-radius: 16px;
            flex-direction: column;
          }

          .kvb-left,
          .kvb-right {
            padding: 1.5rem;
          }

          .kvb-logo-pill {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
            padding: 1.2rem 1rem;
          }

          .kvb-logo-pill-text-main {
            font-size: 1rem !important;
          }

          .kvb-logo-pill-text-sub {
            font-size: 0.65rem !important;
          }

          .kvb-left-title {
            font-size: 1.1rem !important;
            text-align: center;
          }

          .kvb-left-sub {
            font-size: 0.85rem !important;
            text-align: center;
          }

          .kvb-services-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }

          .kvb-service-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 0.75rem;
          }

          .kvb-left-footer {
            justify-content: center;
            gap: 1rem !important;
            font-size: 0.75rem !important;
          }

          .kvb-right-title {
            font-size: 1.25rem !important;
            text-align: center;
          }

          .kvb-right-sub {
            font-size: 0.9rem !important;
            text-align: center;
          }

          .kvb-form-body {
            width: 100%;
          }

          .kvb-input-wrap input {
            font-size: 16px !important; /* Prevent iOS zoom on focus */
          }
        }

        @media (max-width: 480px) {
          .kvb-left,
          .kvb-right {
            padding: 1rem;
          }

          .kvb-logo-pill {
            padding: 1rem 0.75rem;
          }

          .kvb-back-home,
          .kvb-date-pill {
            position: static !important;
            text-align: left;
          }

          .kvb-left-footer span {
            display: block;
            text-align: center;
          }
        }
      `}</style>
      <div className="kvb-auth-shell">
      <div className="kvb-pms-blob kvb-pms-blob-1"></div>
      <div className="kvb-pms-blob kvb-pms-blob-2"></div>
      <div className="kvb-pms-blob kvb-pms-blob-3"></div>

      <div className={`kvb-auth-card ${mounted ? 'mounted' : ''}`}>
        {/* LEFT PANEL (PMS style gradient) */}
        <div className="kvb-left">
          <div className="kvb-left-top">
            <div className="kvb-logo-pill">
              <KvbLogoSmall size={86} />
              <div>
                <div className="kvb-logo-pill-text-main">KENYA VETERINARY BOARD</div>
                <div className="kvb-logo-pill-text-sub">Veterinary Inspection Portal</div>
              </div>
            </div>

            <div>
              <div className="kvb-left-title">KVB Inspection Services</div>
              <div className="kvb-left-sub">
                Secure digital gateway for veterinary input outlet inspections. Conduct
                inspections, review compliance, and generate reports in one place.
              </div>

              <div className="kvb-services-merged">
                <div className="kvb-services-title">
                  <i className="fa fa-shield-alt kvb-service-icon-shield"></i>
                  Inspection Services
                </div>
                <div className="kvb-services-grid">
                  <div className="kvb-service-item">
                    <div className="kvb-service-icon kvb-service-icon-red-blend">
                      <i className="fa fa-magnifying-glass-location"></i>
                    </div>
                    <div className="kvb-service-text">
                      <h4>Outlet Inspection</h4>
                      <p>Conduct on-site inspections of veterinary input outlets and record findings.</p>
                    </div>
                  </div>
                  <div className="kvb-service-item">
                    <div className="kvb-service-icon kvb-service-icon-red-blend">
                      <i className="fa fa-chart-line"></i>
                    </div>
                    <div className="kvb-service-text">
                      <h4>Compliance Monitoring</h4>
                      <p>Track inspection outcomes, compliance status, and certification progress.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kvb-left-footer">
            <span><i className="fa fa-phone"></i> +254-722 305 253</span>
            <span><i className="fa fa-envelope"></i> info@kenyavetboard.or.ke</span>
          </div>
        </div>

        {/* RIGHT PANEL (form) */}
        <div className="kvb-right">
          <Link href="/" className="kvb-back-home">
            <i className="fa fa-arrow-left"></i> Back to Home
          </Link>

          <div className="kvb-date-pill">
            <i className="fa fa-calendar-day"></i>
            <span className="kvb-date-text">Loading date...</span>
          </div>

          <div className="kvb-right-header">
            <div className="kvb-right-title">System Login</div>
            <div className="kvb-right-sub">
              Enter your credentials to access your professional dashboard.
            </div>
          </div>

          <form id="login-form" className="kvb-form" onSubmit={handleSubmit} autoComplete="off">
            <div className="kvb-form-body">
              {error && (
                <div className="kvb-form-error">
                  <i className="fa fa-circle-exclamation"></i> {error}
                </div>
              )}

              <div className="kvb-field">
                <div className="kvb-field-label">
                  <i className="fa fa-user"></i>
                  <span>Username or Email Address</span>
                </div>
                <div className="kvb-input-wrap">
                  <i className="fa fa-user kvb-input-icon"></i>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email address"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="kvb-field field-loginform-password">
                <div className="kvb-field-label">
                  <i className="fa fa-key"></i>
                  <span>Password</span>
                </div>
                <div className="kvb-input-wrap">
                  <i className="fa fa-lock kvb-input-icon"></i>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your secure password"
                    autoComplete="current-password"
                    required
                  />
                  <i
                    className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                    id="togglePassword"
                    onClick={() => setShowPassword(!showPassword)}
                  ></i>
                </div>
              </div>

              <div className="kvb-form-footer-top">
                <div className="kvb-remember">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    className="form-check-input"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember Me
                  </label>
                </div>
                <a href="/forgot-password">
                  <i className="fa fa-circle-question"></i> Forgot password?
                </a>
              </div>

              <button type="submit" className="kvb-btn kvb-btn-primary">
                <span className="btn-text">Sign in to portal</span>
                <i className="fa fa-arrow-right-to-bracket"></i>
              </button>

              <a className="kvb-btn kvb-btn-outline" href="/register">
                <i className="fa fa-user-plus"></i> Create new account
              </a>

              <div className="kvb-support">
                <i className="fa fa-headset"></i>
                <span>Need help logging in? </span>
                Contact KVB support: +254-722 305 253 or info@kenyavetboard.or.ke
              </div>
            </div>
          </form>
        </div>
      </div>
      </div>
    </>
  );
}
