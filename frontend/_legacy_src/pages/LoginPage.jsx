import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import kvbLogo from '../assets/KVB Logo.jpg';

export default function LoginPage() {
  const [form, setForm] = useState({ username: 'inspector1', password: 'Password123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(form.username, form.password);
      const redirectTo = location.state?.from || '/dashboard';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <img src={kvbLogo} alt="Kenya Veterinary Board" className="brand-mark large" />
          <h1>Kenya Veterinary Board</h1>
          <p>Veterinary Inspection Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Username or Email
            <input type="text" name="username" value={form.username} onChange={handleChange} />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleChange} />
          </label>

          {error && <div className="form-error">{error}</div>}

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in to portal'}
          </button>
        </form>

        <div className="login-footer">
          <p>Need help logging in? Contact KVB support through:</p>
          <p>+254-722 305 253 | +254-701 581 718</p>
          <p>info@kenyavetboard.or.ke</p>
        </div>
      </div>
    </div>
  );
}
