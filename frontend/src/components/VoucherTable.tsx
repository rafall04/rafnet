import { Voucher } from '../api/types';
import './VoucherTable.css';

interface VoucherTableProps {
  vouchers: Voucher[];
  onEdit: (voucher: Voucher) => void;
  onDelete: (voucher: Voucher) => void;
  isLoading?: boolean;
}

/**
 * Voucher Table Component
 * Displays a table of all vouchers with edit/delete actions
 * Requirements: 5.3
 */
export function VoucherTable({ vouchers, onEdit, onDelete, isLoading }: VoucherTableProps) {
  if (isLoading) {
    return (
      <div className="table-loading">
        <span>Loading vouchers...</span>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <div className="table-empty">
        <span>🎟️</span>
        <p>No vouchers found</p>
        <p className="table-empty-hint">Create your first voucher to get started</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Duration</th>
            <th>Price</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((voucher) => (
            <tr key={voucher.id}>
              <td>
                <div className="cell-primary voucher-code">{voucher.code}</div>
              </td>
              <td>{voucher.duration}</td>
              <td>Rp {voucher.price.toLocaleString('id-ID')}</td>
              <td>
                <span className={`status-badge ${voucher.isActive ? 'active' : 'inactive'}`}>
                  {voucher.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn-action btn-edit"
                    onClick={() => onEdit(voucher)}
                    title="Edit voucher"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => onDelete(voucher)}
                    title="Delete voucher"
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

export default VoucherTable;
