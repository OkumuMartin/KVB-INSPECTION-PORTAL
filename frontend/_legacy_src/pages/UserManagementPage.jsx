import { useEffect, useState } from 'react';
import apiRequest from '../services/api';
import Pagination from '../components/Pagination';

const ROLES = ['INSPECTOR', 'DIRECTOR', 'CEO_REGISTRAR', 'SYSTEM_ADMIN'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

const roleLabels = {
  INSPECTOR: 'Inspector',
  DIRECTOR: 'Director',
  CEO_REGISTRAR: 'CEO / Registrar',
  SYSTEM_ADMIN: 'System Admin',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 50;
  const [form, setForm] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'INSPECTOR',
    status: 'ACTIVE',
  });

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/users?page=${page}&limit=${limit}`);
      setUsers(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [page]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/users', { method: 'POST', body: JSON.stringify(form) });
      setShowCreateDialog(false);
      setForm({ name: '', email: '', username: '', password: '', role: 'INSPECTOR', status: 'ACTIVE' });
      loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to create user.');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await apiRequest(`/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadUsers();
    } catch (err) {
      setError(err.message || 'Unable to change user status.');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter new password for this user:');
    if (!newPassword || newPassword.length < 8) {
      if (newPassword) alert('Password must be at least 8 characters.');
      return;
    }
    try {
      await apiRequest(`/users/${userId}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword }),
      });
      alert('Password has been reset.');
    } catch (err) {
      setError(err.message || 'Unable to reset password.');
    }
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>User Management</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreateDialog(true)}>
          Create User
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      {loading ? (
        <div className="loader">Loading users...</div>
      ) : users.length === 0 ? (
        <p className="empty-state">No users found.</p>
      ) : (
        <>
          <div className="list-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.username}</td>
                    <td>{roleLabels[user.role] || user.role}</td>
                    <td>
                      <span className={`status-badge ${user.status}`} style={{ fontSize: 11 }}>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() => handleStatusChange(user._id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                        >
                          {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '4px 8px' }}
                          onClick={() => handleResetPassword(user._id)}
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
        </>
      )}

      {showCreateDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="panel" style={{ maxWidth: 500, width: '90%', borderRadius: 14 }}>
            <h2 style={{ color: 'var(--kvb-green-dark)', fontSize: 16, margin: '0 0 16px' }}>Create New User</h2>
            <form onSubmit={handleCreate} className="form-panel">
              <label className="field-label">
                Full Name *
                <input type="text" name="name" value={form.name} onChange={handleChange} required />
              </label>
              <label className="field-label">
                Email *
                <input type="email" name="email" value={form.email} onChange={handleChange} required />
              </label>
              <label className="field-label">
                Username *
                <input type="text" name="username" value={form.username} onChange={handleChange} required />
              </label>
              <label className="field-label">
                Password *
                <input type="password" name="password" value={form.password} onChange={handleChange} minLength={8} required />
              </label>
              <label className="field-label">
                Role *
                <select name="role" value={form.role} onChange={handleChange} required>
                  {ROLES.map((role) => (
                    <option key={role} value={role}>{roleLabels[role] || role}</option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                Status
                <select name="status" value={form.status} onChange={handleChange}>
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </label>
              <div className="action-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateDialog(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
