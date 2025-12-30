import { useState, useEffect, FormEvent } from 'react';
import { Package, CreatePackageDTO, UpdatePackageDTO, ValidationError } from '../api/types';
import './PackageForm.css';

interface PackageFormProps {
  package?: Package | null;
  onSubmit: (data: CreatePackageDTO | UpdatePackageDTO) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverErrors?: ValidationError[];
}

/**
 * Package Form Component
 * Form for creating/editing packages with inline validation
 * Requirements: 5.4, 5.6
 */
export function PackageForm({ 
  package: editPackage, 
  onSubmit, 
  onCancel, 
  isSubmitting = false,
  serverErrors = []
}: PackageFormProps) {
  const [name, setName] = useState('');
  const [speed, setSpeed] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editPackage;

  // Populate form when editing
  useEffect(() => {
    if (editPackage) {
      setName(editPackage.name);
      setSpeed(editPackage.speed);
      setPrice(editPackage.price.toString());
      setDescription(editPackage.description || '');
      setIsActive(editPackage.isActive);
    } else {
      // Reset form for new package
      setName('');
      setSpeed('');
      setPrice('');
      setDescription('');
      setIsActive(true);
    }
    setErrors({});
  }, [editPackage]);

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

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!speed.trim()) {
      newErrors.speed = 'Speed is required';
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

    const data: CreatePackageDTO | UpdatePackageDTO = {
      name: name.trim(),
      speed: speed.trim(),
      price: Number(price),
      description: description.trim() || undefined,
      isActive,
    };

    await onSubmit(data);
  };

  return (
    <div className="form-modal-overlay" onClick={onCancel}>
      <div className="form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h2>{isEditing ? 'Edit Package' : 'Add New Package'}</h2>
          <button className="btn-close" onClick={onCancel} type="button">
            ✕
          </button>
        </div>

        <form className="package-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Package Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Basic Plan"
              disabled={isSubmitting}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="speed">Speed *</label>
            <input
              type="text"
              id="speed"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
              placeholder="e.g., 10 Mbps"
              disabled={isSubmitting}
              className={errors.speed ? 'input-error' : ''}
            />
            {errors.speed && <span className="error-message">{errors.speed}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (Rp) *</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 150000"
              min="0"
              step="1000"
              disabled={isSubmitting}
              className={errors.price ? 'input-error' : ''}
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this package"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
              />
              <span>Active (visible on public page)</span>
            </label>
          </div>

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
              {isSubmitting ? 'Saving...' : isEditing ? 'Update Package' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PackageForm;
