import { useState, useEffect, useCallback } from 'react';
import { Package, CreatePackageDTO, UpdatePackageDTO, ValidationError } from '../api/types';
import { apiClient } from '../api/client';
import { PackageTable } from '../components/PackageTable';
import { PackageForm } from '../components/PackageForm';
import './PackagesPage.css';

/**
 * Packages Management Page
 * Requirements: 5.2, 5.4, 5.6
 */
export function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<ValidationError[]>([]);
  
  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch packages
  const fetchPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getPackages();
      setPackages(data);
    } catch (err) {
      setError('Failed to load packages');
      console.error('Error fetching packages:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  // Handle create/edit
  const handleOpenCreate = () => {
    setEditingPackage(null);
    setServerErrors([]);
    setShowForm(true);
  };

  const handleOpenEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setServerErrors([]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPackage(null);
    setServerErrors([]);
  };

  const handleSubmit = async (data: CreatePackageDTO | UpdatePackageDTO) => {
    try {
      setIsSubmitting(true);
      setServerErrors([]);

      if (editingPackage) {
        await apiClient.updatePackage(editingPackage.id, data);
      } else {
        await apiClient.createPackage(data as CreatePackageDTO);
      }

      handleCloseForm();
      await fetchPackages();
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
  const handleOpenDelete = (pkg: Package) => {
    setDeleteTarget(pkg);
  };

  const handleCloseDelete = () => {
    setDeleteTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await apiClient.deletePackage(deleteTarget.id);
      handleCloseDelete();
      await fetchPackages();
    } catch (err) {
      console.error('Error deleting package:', err);
      setError('Failed to delete package');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="packages-page">
      <div className="page-header">
        <div>
          <h1>Packages</h1>
          <p>Manage your internet packages</p>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          + Add Package
        </button>
      </div>

      {error && (
        <div className="page-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <PackageTable
        packages={packages}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        isLoading={isLoading}
      />

      {showForm && (
        <PackageForm
          package={editingPackage}
          onSubmit={handleSubmit}
          onCancel={handleCloseForm}
          isSubmitting={isSubmitting}
          serverErrors={serverErrors}
        />
      )}

      {deleteTarget && (
        <div className="delete-modal-overlay" onClick={handleCloseDelete}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Package</h3>
            <p>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
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

export default PackagesPage;
