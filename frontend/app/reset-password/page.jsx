'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { extractError } from '../../lib/errors';
import { KvbLogoSmall } from '../../components/KvbLogo';

function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'Contains a letter', ok: /[A-Za-z]/.test(password) },
    { label: 'Contains a number', ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;

  return (
    <div className="kvb-password-strength">
      <div className="kvb-password-bars">
        {[1, 2, 3].map((step) => (
          <span
            key={step}
            className={`kvb-password-bar ${score >= step ? `active level-${score}` : ''}`}
          ></span>
        ))}
      </div>
      <ul className="kvb-password-checks">
        {checks.map((check) => (
          <li key={check.label} className={check.ok ? 'ok' : ''}>
            <i className={`fa ${check.ok ? 'fa-circle-check' : 'fa-circle'}`}></i> {check.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="kvb-auth-shell">
          <div className="kvb-auth-card mounted">
            <div className="kvb-right">
              <div className="kvb-right-header">
                <div className="kvb-right-title">Reset Password</div>
                <div className="kvb-right-sub">Loading your reset link...</div>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const value = searchParams?.get('token');
    if (value) setToken(value);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');

    if (!token) {
      setError('This reset link is missing its token. Please request a new one.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
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
                <div className="kvb-left-title">Choose a New Password</div>
                <div className="kvb-left-sub">
                  Pick a strong password you do not use elsewhere. Once saved you can
                  sign in immediately with your new credentials.
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

            <div className="kvb-right-header">
              <div className="kvb-right-title">Reset Password</div>
              <div className="kvb-right-sub">Set a new password for your inspection portal account.</div>
            </div>

            {done ? (
              <div className="kvb-form">
                <div className="kvb-form-body">
                  <div className="kvb-form-success">
                    <i className="fa fa-circle-check"></i>
                    <h3>Password updated</h3>
                    <p>Your password has been changed successfully. You can now sign in to the portal.</p>
                  </div>

                  <Link href="/login" className="kvb-btn kvb-btn-primary">
                    <i className="fa fa-arrow-right-to-bracket"></i> Go to sign in
                  </Link>
                </div>
              </div>
            ) : (
              <form className="kvb-form" onSubmit={handleSubmit} noValidate>
                <div className="kvb-form-body">
                  {error && (
                    <div className="kvb-form-error">
                      <i className="fa fa-circle-exclamation"></i> {error}
                    </div>
                  )}

                  {!token && (
                    <div className="kvb-form-note">
                      <i className="fa fa-circle-exclamation"></i>
                      <span>
                        No reset token was found in this link.{' '}
                        <Link href="/forgot-password">Request a new reset link</Link>.
                      </span>
                    </div>
                  )}

                  <div className="kvb-field">
                    <div className="kvb-field-label">
                      <i className="fa fa-key"></i>
                      <span>New Password</span>
                    </div>
                    <div className="kvb-input-wrap">
                      <i className="fa fa-lock kvb-input-icon"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter a strong new password"
                        autoComplete="new-password"
                        required
                      />
                      <i
                        className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} password-toggle`}
                        onClick={() => setShowPassword(!showPassword)}
                      ></i>
                    </div>
                  </div>

                  <PasswordStrength password={password} />

                  <div className="kvb-field">
                    <div className="kvb-field-label">
                      <i className="fa fa-key"></i>
                      <span>Confirm New Password</span>
                    </div>
                    <div className="kvb-input-wrap">
                      <i className="fa fa-lock kvb-input-icon"></i>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="kvb-btn kvb-btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <i className="fa fa-circle-notch fa-spin"></i>
                        <span className="btn-text">Saving...</span>
                      </>
                    ) : (
                      <>
                        <span className="btn-text">Update password</span>
                        <i className="fa fa-check"></i>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
