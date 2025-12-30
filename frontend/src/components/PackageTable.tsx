import { Package } from '../api/types';
import './PackageTable.css';

interface PackageTableProps {
  packages: Package[];
  onEdit: (pkg: Package) => void;
  onDelete: (pkg: Package) => void;
  isLoading?: boolean;
}

/**
 * Package Table Component
 * Displays a table of all packages with edit/delete actions
 * Requirements: 5.2
 */
export function PackageTable({ packages, onEdit, onDelete, isLoading }: PackageTableProps) {
  if (isLoading) {
    return (
      <div className="table-loading">
        <span>Loading packages...</span>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="table-empty">
        <span>📦</span>
        <p>No packages found</p>
        <p className="table-empty-hint">Create your first package to get started</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Speed</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>
                <div className="cell-primary">{pkg.name}</div>
                {pkg.description && (
                  <div className="cell-secondary">{pkg.description}</div>
                )}
              </td>
              <td>{pkg.speed}</td>
              <td>Rp {pkg.price.toLocaleString('id-ID')}</td>
              <td>
                <span className={`status-badge ${pkg.isActive ? 'active' : 'inactive'}`}>
                  {pkg.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-edit"
                    onClick={() => onEdit(pkg)}
                    title="Edit package"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => onDelete(pkg)}
                    title="Delete package"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default PackageTable;
