'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { extractError } from '../../lib/errors';
import ThemeToggle from '../../components/ThemeToggle';
import { KvbLogoSmall } from '../../components/KvbLogo';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      const data = await requestPasswordReset(email);
      setSent(true);
      if (data?.devResetUrl) setDevResetUrl(data.devResetUrl);
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
                <div className="kvb-left-title">Account Recovery</div>
                <div className="kvb-left-sub">
                  Enter the email address registered with your account and we will send
                  you a secure, time-limited link to choose a new password.
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
              <div className="kvb-right-title">Forgot Password</div>
              <div className="kvb-right-sub">
                We will email you a reset link if the address matches an active account.
              </div>
            </div>

            {sent ? (
              <div className="kvb-form">
                <div className="kvb-form-body">
                  <div className="kvb-form-success">
                    <i className="fa fa-envelope-circle-check"></i>
                    <h3>Check your inbox</h3>
                    <p>
                      If an account exists for <strong>{email}</strong>, a password reset
                      link is on its way. The link expires in 60 minutes.
                    </p>
                    <p className="kvb-form-note">
                      <i className="fa fa-circle-info"></i> For your security we show the
                      same message whether or not the address is registered.
                    </p>
                  </div>

                  {devResetUrl && (
                    <div className="kvb-form-note kvb-form-note-dev">
                      <i className="fa fa-flask"></i>
                      <span>
                        <strong>Development mode:</strong> SMTP is not configured, so the
                        reset link was not delivered.
                        <br />
                        <a href={devResetUrl}>Open the reset link</a>
                      </span>
                    </div>
                  )}

                  <Link href="/login" className="kvb-btn kvb-btn-primary">
                    <i className="fa fa-arrow-right-to-bracket"></i> Return to sign in
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

                  <div className="kvb-field">
                    <div className="kvb-field-label">
                      <i className="fa fa-envelope"></i>
                      <span>Email Address</span>
                    </div>
                    <div className="kvb-input-wrap">
                      <i className="fa fa-envelope kvb-input-icon"></i>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="kvb-btn kvb-btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <i className="fa fa-circle-notch fa-spin"></i>
                        <span className="btn-text">Sending link...</span>
                      </>
                    ) : (
                      <>
                        <span className="btn-text">Send reset link</span>
                        <i className="fa fa-paper-plane"></i>
                      </>
                    )}
                  </button>

                  <div className="kvb-support">
                    <i className="fa fa-headset"></i>
                    <span>Need help? </span>
                    Contact KVB support: +254-722 305 253 or info@kenyavetboard.or.ke
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
