import { useState } from 'react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    sessionTimeout: '480',
    itemsPerPage: '25',
    autoSaveDrafts: true,
    emailNotifications: true,
    gpsCapture: true,
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('kvb-settings', JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>System Settings</h1>
        </div>
      </div>

      <div className="panel">
        <h2>Application Preferences</h2>

        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <label className="field-label">
            Session Timeout (minutes)
            <select name="sessionTimeout" value={settings.sessionTimeout} onChange={handleChange}>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
              <option value="480">8 hours</option>
              <option value="1440">24 hours</option>
            </select>
          </label>
          <label className="field-label">
            Items per Page
            <select name="itemsPerPage" value={settings.itemsPerPage} onChange={handleChange}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </label>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              name="autoSaveDrafts"
              checked={settings.autoSaveDrafts}
              onChange={handleChange}
            />
            Auto-save drafts
          </label>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
            />
            Email notifications
          </label>
          <label className="field-label" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              name="gpsCapture"
              checked={settings.gpsCapture}
              onChange={handleChange}
            />
            Enable GPS capture
          </label>
        </div>

        <div className="action-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {saved && <span style={{ color: 'var(--kvb-green)', fontSize: 13, marginLeft: 8 }}>Saved!</span>}
        </div>
      </div>

      <div className="panel">
        <h2>System Information</h2>
        <dl className="review-panel">
          <div><dt>Version</dt><dd>1.0.0</dd></div>
          <div><dt>Environment</dt><dd>{import.meta.env.MODE || 'development'}</dd></div>
          <div><dt>API Base</dt><dd>{import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}</dd></div>
        </dl>
      </div>
    </div>
  );
}
