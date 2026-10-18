import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="page-shell center-box">
      <div className="panel">
        <h1>Page not found</h1>
        <p>The page you requested does not exist.</p>
        <Link to="/dashboard" className="btn btn-primary">Return to dashboard</Link>
      </div>
    </div>
  );
}
