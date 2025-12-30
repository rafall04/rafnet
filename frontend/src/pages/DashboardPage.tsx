import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

/**
 * Admin Dashboard Home Page
 * Requirements: 5.1
 */
export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="welcome-section">
        <h1>Welcome, {user?.username || 'Admin'}!</h1>
        <p>Manage your RAF NET internet packages and vouchers from this dashboard.</p>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-icon">📦</div>
          <h3>Packages</h3>
          <p>Manage monthly internet subscription packages</p>
          <a href="/admin/packages" className="card-link">Go to Packages →</a>
        </div>

        <div className="dashboard-card">
          <div className="card-icon">🎟️</div>
          <h3>Vouchers</h3>
          <p>Manage prepaid voucher codes and pricing</p>
          <a href="/admin/vouchers" className="card-link">Go to Vouchers →</a>
        </div>
      </div>

      <div className="quick-info">
        <h2>Quick Info</h2>
        <ul>
          <li>Use the sidebar navigation to switch between sections</li>
          <li>Click "Add Package" or "Add Voucher" to create new items</li>
          <li>Toggle active status to show/hide items on the public page</li>
        </ul>
      </div>
    </div>
  );
}

export default DashboardPage;
