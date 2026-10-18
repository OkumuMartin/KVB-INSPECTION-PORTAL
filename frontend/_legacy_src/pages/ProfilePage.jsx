import { useEffect, useState } from 'react';
import apiRequest from '../services/api';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ current: '', newPassword: '', confirm: '' });
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiRequest('/auth/me');
        setUser(data.user);
      } catch (err) {
        setError(err.message || 'Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) {
      setError('New passwords do not match.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    try {
      setSaving(true);
      await apiRequest(`/users/${user._id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: passwordForm.newPassword }),
      });
      setShowPasswordForm(false);
      setPasswordForm({ current: '', newPassword: '', confirm: '' });
      alert('Password changed successfully.');
    } catch (err) {
      setError(err.message || 'Unable to change password.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loader">Loading profile...</div>;

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{user?.name || 'My Profile'}</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(!showPasswordForm)}>
          {showPasswordForm ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <h2>Account Information</h2>
        <dl className="review-panel">
          <div><dt>Full Name</dt><dd>{user?.name}</dd></div>
          <div><dt>Email</dt><dd>{user?.email}</dd></div>
          <div><dt>Username</dt><dd>{user?.username}</dd></div>
          <div><dt>Role</dt><dd>{user?.role}</dd></div>
          <div><dt>Status</dt><dd>{user?.status}</dd></div>
        </dl>
      </div>

      {showPasswordForm && (
        <div className="panel">
          <h2>Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="form-panel">
            <label className="field-label">
              New Password
              <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} minLength={8} required />
            </label>
            <label className="field-label">
              Confirm New Password
              <input type="password" name="confirm" value={passwordForm.confirm} onChange={handlePasswordChange} required />
            </label>
            <div className="action-row justify-end">
              <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
