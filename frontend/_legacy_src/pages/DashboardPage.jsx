import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import apiRequest from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

const dashboardMeta = {
  INSPECTOR: {
    title: 'Inspector Dashboard',
    description: 'My inspections and draft workflow',
  },
  DIRECTOR: {
    title: 'Director Dashboard',
    description: 'Pending review and approvals',
  },
  CEO_REGISTRAR: {
    title: 'CEO / Registrar Dashboard',
    description: 'Final decision queue and approvals',
  },
  SYSTEM_ADMIN: {
    title: 'System Administration',
    description: 'Users, audit operations, and platform controls',
  },
};

const statusLabels = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PENDING_DIRECTOR_REVIEW: 'Pending Review',
  DIRECTOR_APPROVED: 'Director Approved',
  PENDING_CEO_REVIEW: 'Pending Final Approval',
  RETURNED_TO_INSPECTOR: 'Returned',
  FINAL_APPROVED: 'Final Approved',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const meta = dashboardMeta[user?.role] || dashboardMeta.INSPECTOR;

  useEffect(() => {
    if (!user) return;

    const loadInspections = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/inspections');
        setInspections(data.items || []);
      } catch (error) {
        setInspections([]);
      } finally {
        setLoading(false);
      }
    };

    loadInspections();
  }, [user]);

  const metrics = useMemo(() => {
    const counts = {
      DRAFT: 0,
      SUBMITTED: 0,
      PENDING_DIRECTOR_REVIEW: 0,
      DIRECTOR_APPROVED: 0,
      PENDING_CEO_REVIEW: 0,
      RETURNED_TO_INSPECTOR: 0,
      FINAL_APPROVED: 0,
    };

    inspections.forEach((inspection) => {
      counts[inspection.status] = (counts[inspection.status] || 0) + 1;
    });

    if (user?.role === 'INSPECTOR') {
      return [
        { label: 'My Drafts', value: counts.DRAFT },
        { label: 'Submitted', value: counts.SUBMITTED + counts.PENDING_DIRECTOR_REVIEW },
        { label: 'Returned', value: counts.RETURNED_TO_INSPECTOR },
        { label: 'Approved', value: counts.FINAL_APPROVED },
      ];
    }

    if (user?.role === 'DIRECTOR') {
      return [
        { label: 'Pending Review', value: counts.PENDING_DIRECTOR_REVIEW + counts.SUBMITTED },
        { label: 'Approved', value: counts.DIRECTOR_APPROVED },
        { label: 'Returned', value: counts.RETURNED_TO_INSPECTOR },
        { label: 'Total', value: inspections.length },
      ];
    }

    if (user?.role === 'CEO_REGISTRAR') {
      return [
        { label: 'Pending Final Approval', value: counts.PENDING_CEO_REVIEW + counts.DIRECTOR_APPROVED },
        { label: 'Final Approved', value: counts.FINAL_APPROVED },
        { label: 'Returned', value: counts.RETURNED_TO_INSPECTOR },
        { label: 'Total', value: inspections.length },
      ];
    }

    return [
      { label: 'Users', value: 0 },
      { label: 'Audit Logs', value: 0 },
      { label: 'Email Logs', value: 0 },
      { label: 'Settings', value: 'Active' },
    ];
  }, [inspections, user?.role]);

  const handleQuickAction = (action) => {
    if (user?.role === 'INSPECTOR' && action === 'New Inspection') {
      navigate('/inspections/new');
    }
    if (user?.role === 'INSPECTOR' && action === 'Returned') {
      navigate('/inspections/new');
    }
    if (user?.role === 'DIRECTOR' && action === 'Pending Review') {
      navigate('/review');
    }
    if (user?.role === 'CEO_REGISTRAR' && action === 'Pending Final Approval') {
      navigate('/final-review');
    }
  };

  const quickActions = {
    INSPECTOR: ['New Inspection', 'My Drafts', 'Submitted', 'Returned'],
    DIRECTOR: ['Pending Review', 'Approved', 'Returned', 'Total'],
    CEO_REGISTRAR: ['Pending Final Approval', 'Final Approved', 'Returned', 'Total'],
    SYSTEM_ADMIN: [],
  };

  return (
    <div className="content-stack">
      <div className="page-header">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        {user?.role === 'INSPECTOR' && (
          <Link to="/inspections/new" className="btn btn-primary">New Inspection</Link>
        )}
      </div>

      <div className="stats-grid">
        {metrics.map((metric) => (
          <div key={metric.label} className="stat-card">
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      {user?.role !== 'SYSTEM_ADMIN' && (
        <div className="panel">
          <h2>Quick actions</h2>
          <div className="action-row">
            {quickActions[user?.role].map((action) => (
              <button key={action} type="button" className="btn btn-secondary" onClick={() => handleQuickAction(action)}>
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Inspection queue</h2>
        {loading ? (
          <div className="loader">Loading inspections...</div>
        ) : (
          <div className="list-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inspection Number</th>
                  <th>Outlet</th>
                  <th>Inspector</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inspections.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">No inspections available for this role.</td>
                  </tr>
                ) : (
                  inspections.map((inspection) => (
                    <tr key={inspection._id}>
                      <td>{inspection.inspectionNumber}</td>
                      <td>{inspection.outlet?.outletName || inspection.formData?.outletInformation?.outletName || 'N/A'}</td>
                      <td>{inspection.inspector?.name || 'N/A'}</td>
                      <td>{new Date(inspection.inspectionDate).toLocaleDateString()}</td>
                      <td><StatusBadge status={inspection.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {user?.role === 'INSPECTOR' && (
        <div className="panel">
          <h2>Management</h2>
          <div className="action-row">
            <Link to="/outlets" className="btn btn-secondary">Outlet Records</Link>
            <Link to="/profile" className="btn btn-secondary">My Profile</Link>
          </div>
        </div>
      )}

      {user?.role === 'SYSTEM_ADMIN' && (
        <div className="panel">
          <h2>Administration</h2>
          <div className="action-row">
            <Link to="/users" className="btn btn-secondary">User Management</Link>
            <Link to="/outlets" className="btn btn-secondary">Outlet Records</Link>
            <Link to="/audit-logs" className="btn btn-secondary">Audit Logs</Link>
            <Link to="/email-logs" className="btn btn-secondary">Email Logs</Link>
            <Link to="/settings" className="btn btn-secondary">System Settings</Link>
          </div>
        </div>
      )}
    </div>
  );
}
