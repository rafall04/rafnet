import { useState, useEffect, FormEvent } from 'react';
import { Voucher, CreateVoucherDTO, UpdateVoucherDTO, ValidationError } from '../api/types';
import './VoucherForm.css';

interface VoucherFormProps {
  voucher?: Voucher | null;
  onSubmit: (data: CreateVoucherDTO | UpdateVoucherDTO) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverErrors?: ValidationError[];
}

/**
 * Voucher Form Component
 * Form for creating/editing vouchers with inline validation
 * Requirements: 5.5, 5.6
 */
export function VoucherForm({ 
  voucher: editVoucher, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  serverErrors = []
}: VoucherFormProps) {
  const [code, setCode] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editVoucher;

  // Populate form when editing
  useEffect(() => {
    if (editVoucher) {
      setCode(editVoucher.code);
      setDuration(editVoucher.duration);
      setPrice(editVoucher.price.toString());
      setIsActive(editVoucher.isActive);
    } else {
      // Reset form for new voucher
      setCode('');
      setDuration('');
      setPrice('');
      setIsActive(true);
    }
    setErrors({});
  }, [editVoucher]);

  // Map server errors to form fields
  useEffect(() => {
    if (serverErrors.length > 0) {
      const errorMap: Record<string, string> = {};
      serverErrors.forEach((err) => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
    }
  }, [serverErrors]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!code.trim()) {
      newErrors.code = 'Code is required';
    }

    if (!duration.trim()) {
      newErrors.duration = 'Duration is required';
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(price)) || Number(price) < 0) {
      newErrors.price = 'Price must be a valid positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    const data: CreateVoucherDTO | UpdateVoucherDTO = {
      code: code.trim(),
      duration: duration.trim(),
      price: Number(price),
      isActive,
    };

    await onSubmit(data);
  };

  return (
    <div className="form-modal-overlay" onClick={onCancel}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{isEditing ? 'Edit Voucher' : 'Add New Voucher'}</h2>
          <button className="btn-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <form className="voucher-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Voucher Code *</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., WIFI-1DAY-001"
              disabled={isSubmitting}
              className={errors.code ? 'input-error' : ''}
            />
            {errors.code && <span className="error-message">{errors.code}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration *</label>
            <input
              type="text"
              id="duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 1 Day, 7 Days, 30 Days"
              disabled={isSubmitting}
              className={errors.duration ? 'input-error' : ''}
            />
            {errors.duration && <span className="error-message">{errors.duration}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (Rp) *</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 5000"
              min="0"
              step="500"
              disabled={isSubmitting}
              className={errors.price ? 'input-error' : ''}
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Active (available for sale)</span>
            </label>
          </div>

          {errors.general && (
            <div className="form-error-general">
              {errors.general}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Voucher' : 'Create Voucher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VoucherForm;
