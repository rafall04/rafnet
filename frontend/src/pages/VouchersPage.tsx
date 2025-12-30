import { useState, useEffect, useCallback } from 'react';
import { Voucher, CreateVoucherDTO, UpdateVoucherDTO, ValidationError } from '../api/types';
import { apiClient } from '../api/client';
import { VoucherTable } from '../components/VoucherTable';
import { VoucherForm } from '../components/VoucherForm';
import './VouchersPage.css';

/**
 * Vouchers Management Page
 * Requirements: 5.3, 5.5, 5.6
 */
export function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ValidationError[]>([]);
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Voucher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch vouchers
  const fetchVouchers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getVouchers();
      setVouchers(data);
    } catch (err) {
      setError('Failed to load vouchers');
      console.error('Error fetching vouchers:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setServerErrors([]);
    setShowForm(true);
  };

  const handleOpenEdit = (voucher: Voucher) => {
    setEditingVoucher(voucher);
    setServerErrors([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingVoucher(null);
    setServerErrors([]);
  };

  const handleSubmit = async (data: CreateVoucherDTO | UpdateVoucherDTO) => {
    try {
      setIsSubmitting(true);
      setServerErrors([]);

      if (editingVoucher) {
        await apiClient.updateVoucher(editingVoucher.id, data);
      } else {
        await apiClient.createVoucher(data as CreateVoucherDTO);
      }

      handleCloseForm();
      await fetchVouchers();
    } catch (err: unknown) {
      // Handle validation errors from server
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { errors?: ValidationError[]; message?: string } } };
        if (axiosError.response?.data?.errors) {
          setServerErrors(axiosError.response.data.errors);
        } else if (axiosError.response?.data?.message) {
          setServerErrors([{ field: 'general', message: axiosError.response.data.message }]);
        }
      } else {
        setServerErrors([{ field: 'general', message: 'An error occurred while saving' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleOpenDelete = (voucher: Voucher) => {
    setDeleteTarget(voucher);
  };

  const handleCloseDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await apiClient.deleteVoucher(deleteTarget.id);
      handleCloseDelete();
      await fetchVouchers();
    } catch (err) {
      console.error('Error deleting voucher:', err);
      setError('Failed to delete voucher');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="vouchers-page">
      <div className="page-header">
        <div>
          <h1>Vouchers</h1>
          <p>Manage your prepaid voucher codes</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          + Add Voucher
        </button>
      </div>

      {error && (
        <div className="page-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <VoucherTable
        vouchers={vouchers}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        isLoading={isLoading}
      />

      {showForm && (
        <VoucherForm
          voucher={editingVoucher}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
        />
      )}

      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={handleCloseDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Voucher</h3>
            <p>
              Are you sure you want to delete voucher <strong>{deleteTarget.code}</strong>?
              This action cannot be undone.
            </p>
            <div className="delete-actions">
              <button
                className="btn-secondary"
                onClick={handleCloseDelete}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VouchersPage;
