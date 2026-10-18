import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import kvbLogo from '../assets/KVB Logo.jpg';

const navByRole = {
  INSPECTOR: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/inspections/new', label: 'New Inspection' },
    { to: '/outlets', label: 'Outlets' },
    { to: '/inspections/returned', label: 'Returned Items' },
  ],
  DIRECTOR: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/review', label: 'Review Queue' },
    { to: '/outlets', label: 'Outlets' },
  ],
  CEO_REGISTRAR: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/final-review', label: 'Final Review' },
    { to: '/outlets', label: 'Outlets' },
  ],
  SYSTEM_ADMIN: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/users', label: 'Users' },
    { to: '/outlets', label: 'Outlets' },
    { to: '/audit-logs', label: 'Audit Logs' },
    { to: '/email-logs', label: 'Email Logs' },
    { to: '/settings', label: 'Settings' },
  ],
};

const KVB_FOOTER = [
  '© 2026 Kenya Veterinary Board. All rights reserved.',
  'P.O. Box 513 - 00605, Uthiru',
  'Tel: +254-722 305 253 | +254-701 581 718',
  'info@kenyavetboard.or.ke',
  'Upholding Veterinary Standards',
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const links = navByRole[user?.role] || [];
  const showFooter = location.pathname !== '/login';

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-wrap">
          <img src={kvbLogo} alt="Kenya Veterinary Board" className="brand-mark" />
          <div>
            <div className="brand-title">Kenya Veterinary Board</div>
            <div className="brand-subtitle">Upholding Veterinary Standards | Veterinary Inspection Portal</div>
          </div>
        </div>

        {user && (
          <nav className="main-nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        {user ? (
          <div className="topbar-actions">
            <Link to="/profile" className="user-pill" style={{ textDecoration: 'none', color: 'inherit' }}>
              {user.name}
            </Link>
            <button type="button" className="btn btn-secondary" onClick={logout}>Logout</button>
          </div>
        ) : (
          <Link to="/login" className="btn btn-primary">Login</Link>
        )}
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      {showFooter && (
        <footer className="kvb-footer">
          <div>
            {KVB_FOOTER.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}
