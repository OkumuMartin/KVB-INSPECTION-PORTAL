'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { extractError } from '../../lib/errors';
import ThemeToggle from '../../components/ThemeToggle';
import { KvbLogoSmall } from '../../components/KvbLogo';

const STRENGTH_RULES = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Contains a letter', test: (v) => /[A-Za-z]/.test(v) },
  { label: 'Contains a number', test: (v) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }
    const failed = STRENGTH_RULES.filter((rule) => !rule.test(form.password));
    if (failed.length) {
      setError(`Password must satisfy: ${failed.map((f) => f.label.toLowerCase()).join(', ')}.`);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
      });
      router.push('/login?registered=1');
    } catch (err) {
      setError(extractError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="kvb-auth-shell">
        <div className="kvb-pms-blob kvb-pms-blob-1"></div>
        <div className="kvb-pms-blob kvb-pms-blob-2"></div>
        <div className="kvb-pms-blob kvb-pms-blob-3"></div>

        <div className="kvb-auth-card mounted">
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
                <div className="kvb-left-title">Join the KVB Network</div>
                <div className="kvb-left-sub">
                  Create an inspector account to conduct outlet inspections, record
                  findings, and track compliance from any device.
                </div>
              </div>
            </div>

            <div className="kvb-left-footer">
              <span><i className="fa fa-phone"></i> +254-722 305 253</span>
              <span><i className="fa fa-envelope"></i> info@kenyavetboard.or.ke</span>
            </div>
          </div>

          <div className="kvb-right">
            <Link href="/login" className="kvb-back-home">
              <i className="fa fa-arrow-left"></i> Back to Sign in
            </Link>

            <ThemeToggle className="kvb-auth-theme-toggle" />

            <div className="kvb-right-header">
              <div className="kvb-right-title">Create Account</div>
              <div className="kvb-right-sub">
                Register as a veterinary inspector. Administrator roles are assigned by
                the KVB system administrator after registration.
              </div>
            </div>

            <form className="kvb-form" onSubmit={handleSubmit} noValidate>
              <div className="kvb-form-body">
                {error && (
                  <div className="kvb-form-error">
                    <i className="fa fa-circle-exclamation"></i> {error}
                  </div>
                )}

                <div className="kvb-field">
                  <div className="kvb-field-label">
                    <i className="fa fa-user"></i>
                    <span>Full Name</span>
                  </div>
                  <div className="kvb-input-wrap">
                    <i className="fa fa-user kvb-input-icon"></i>
                    <input
                      type="text"
                      value={form.name}
                      onChange={update('name')}
                      placeholder="e.g. Dr. Jane Wanjiku"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div className="kvb-field">
                  <div className="kvb-field-label">
                    <i className="fa fa-envelope"></i>
                    <span>Email Address</span>
                  </div>
                  <div className="kvb-input-wrap">
                    <i className="fa fa-envelope kvb-input-icon"></i>
                    <input
                      type="email"
                      value={form.email}
                      onChange={update('email')}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="kvb-field">
                  <div className="kvb-field-label">
                    <i className="fa fa-at"></i>
                    <span>Username</span>
                  </div>
                  <div className="kvb-input-wrap">
                    <i className="fa fa-at kvb-input-icon"></i>
                    <input
                      type="text"
                      value={form.username}
                      onChange={update('username')}
                      placeholder="Choose a username"
                      autoComplete="username"
                      required
                    />
                  </div>
                </div>

                <div className="kvb-field">
                  <div className="kvb-field-label">
                    <i className="fa fa-key"></i>
                    <span>Password</span>
                  </div>
                  <div className="kvb-input-wrap">
                    <i className="fa fa-lock kvb-input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={update('password')}
                      placeholder="At least 8 characters with a number"
                      autoComplete="new-password"
                      required
                    />
                    <i
                      className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                      onClick={() => setShowPassword(!showPassword)}
                    ></i>
                  </div>
                </div>

                <div className="kvb-field">
                  <div className="kvb-field-label">
                    <i className="fa fa-key"></i>
                    <span>Confirm Password</span>
                  </div>
                  <div className="kvb-input-wrap">
                    <i className="fa fa-lock kvb-input-icon"></i>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.confirmPassword}
                      onChange={update('confirmPassword')}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="kvb-btn kvb-btn-primary" disabled={submitting}>
                  {submitting ? (
                    <>
                      <i className="fa fa-circle-notch fa-spin"></i>
                      <span className="btn-text">Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span className="btn-text">Create account</span>
                      <i className="fa fa-user-plus"></i>
                    </>
                  )}
                </button>

                <div className="kvb-support">
                  <i className="fa fa-shield-halved"></i>
                  <span>Your details are stored securely. </span>
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
