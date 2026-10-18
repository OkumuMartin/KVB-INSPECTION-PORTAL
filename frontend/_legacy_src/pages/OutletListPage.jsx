import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiRequest from '../services/api';
import Pagination from '../components/Pagination';

export default function OutletListPage() {
  const navigate = useNavigate();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ county: '', outletType: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 25;

  const loadOutlets = async (params = {}) => {
    try {
      setLoading(true);
      setError('');
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (params.county || filters.county) query.append('county', params.county || filters.county);
      if (params.outletType || filters.outletType) query.append('outletType', params.outletType || filters.outletType);
      query.append('page', page);
      query.append('limit', limit);

      const data = await apiRequest(`/outlets?${query.toString()}`);
      setOutlets(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unable to load outlets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOutlets();
  }, [page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleFilterApply = () => {
    setPage(1);
    loadOutlets({ ...filters });
  };

  const handleSearch = () => {
    setPage(1);
    loadOutlets({ county: '', outletType: '' });
  };

  const handleClearFilters = () => {
    setSearch('');
    setFilters({ county: '', outletType: '' });
    setPage(1);
    loadOutlets({ county: '', outletType: '' });
  };

  return (
    <div className="content-stack narrow-box">
      <div className="page-header">
        <div>
          <p className="eyebrow">Outlets</p>
          <h1>Veterinary Inputs Outlets</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/outlets/new')}>
          New Outlet
        </button>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="panel">
        <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
          <label className="field-label">
            Search
            <input
              type="text"
              placeholder="Outlet name, owner, county..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </label>
          <label className="field-label">
            County
            <input name="county" value={filters.county} onChange={handleFilterChange} placeholder="Filter by county" />
          </label>
          <label className="field-label">
            Outlet Type
            <select name="outletType" value={filters.outletType} onChange={handleFilterChange}>
              <option value="">All Types</option>
              <option value="AGROVET">Agrovet</option>
              <option value="CHEMIST">Chemist</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <div className="action-row">
            <button type="button" className="btn btn-secondary" onClick={handleFilterApply}>Apply</button>
            <button type="button" className="btn btn-secondary" onClick={handleClearFilters}>Clear</button>
          </div>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="loader">Loading outlets...</div>
        ) : outlets.length === 0 ? (
          <p className="empty-state">No outlets found matching your criteria.</p>
        ) : (
          <>
            <div className="list-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Outlet Name</th>
                    <th>Owner</th>
                    <th>County</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outlets.map((outlet) => (
                    <tr key={outlet._id}>
                      <td>{outlet.outletName}</td>
                      <td>{outlet.ownerName}</td>
                      <td>{outlet.county || 'N/A'}</td>
                      <td>{outlet.outletType}</td>
                      <td>
                        <button type="button" className="btn btn-secondary" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => navigate(`/outlets/${outlet._id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
