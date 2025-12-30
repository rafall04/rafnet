import { VoucherRepository, VoucherEntity, CreateVoucherData, UpdateVoucherData } from '../repositories/voucher.repository';

export interface Voucher {
  id: number;
  code: string;
  duration: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoucherDTO {
  code: string;
  duration: string;
  price: number;
  isActive?: boolean;
}

export interface UpdateVoucherDTO {
  code?: string;
  duration?: string;
  price?: number;
  isActive?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationException';
  }
}

export class VoucherService {
  constructor(private repository: VoucherRepository) {}

  private mapEntityToVoucher(entity: VoucherEntity): Voucher {
    return {
      id: entity.id,
      code: entity.code,
      duration: entity.duration,
      price: entity.price,
      isActive: entity.is_active === 1,
      createdAt: new Date(entity.created_at),
      updatedAt: new Date(entity.updated_at)
    };
  }

  findAll(): Voucher[] {
    return this.repository.findAll().map(e => this.mapEntityToVoucher(e));
  }

  findActive(): Voucher[] {
    return this.repository.findActive().map(e => this.mapEntityToVoucher(e));
  }

  findById(id: number): Voucher | null {
    const entity = this.repository.findById(id);
    return entity ? this.mapEntityToVoucher(entity) : null;
  }

  isCodeUnique(code: string, excludeId?: number): boolean {
    const existing = this.repository.findByCode(code);
    if (!existing) return true;
    if (excludeId !== undefined && existing.id === excludeId) return true;
    return false;
  }

  create(data: CreateVoucherDTO): Voucher {
    const errors = this.validateCreate(data);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // Check code uniqueness
    if (!this.isCodeUnique(data.code.trim())) {
      throw new ValidationException([{ field: 'code', message: 'Voucher code already exists' }]);
    }

    const createData: CreateVoucherData = {
      code: data.code.trim(),
      duration: data.duration.trim(),
      price: data.price,
      isActive: data.isActive
    };

    const entity = this.repository.create(createData);
    return this.mapEntityToVoucher(entity);
  }

  update(id: number, data: UpdateVoucherDTO): Voucher | null {
    const errors = this.validateUpdate(data);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    // Check code uniqueness if code is being updated
    if (data.code !== undefined && !this.isCodeUnique(data.code.trim(), id)) {
      throw new ValidationException([{ field: 'code', message: 'Voucher code already exists' }]);
    }

    const updateData: UpdateVoucherData = {};
    if (data.code !== undefined) updateData.code = data.code.trim();
    if (data.duration !== undefined) updateData.duration = data.duration.trim();
    if (data.price !== undefined) updateData.price = data.price;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const entity = this.repository.update(id, updateData);
    return entity ? this.mapEntityToVoucher(entity) : null;
  }

  delete(id: number): boolean {
    return this.repository.delete(id);
  }

  private validateCreate(data: CreateVoucherDTO): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.code || data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Code is required' });
    }

    if (!data.duration || data.duration.trim().length === 0) {
      errors.push({ field: 'duration', message: 'Duration is required' });
    }

    if (data.price === undefined || data.price === null) {
      errors.push({ field: 'price', message: 'Price is required' });
    } else if (typeof data.price !== 'number' || isNaN(data.price)) {
      errors.push({ field: 'price', message: 'Price must be a valid number' });
    } else if (data.price < 0) {
      errors.push({ field: 'price', message: 'Price must be non-negative' });
    }

    return errors;
  }

  private validateUpdate(data: UpdateVoucherDTO): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.code !== undefined && data.code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Code cannot be empty' });
    }

    if (data.duration !== undefined && data.duration.trim().length === 0) {
      errors.push({ field: 'duration', message: 'Duration cannot be empty' });
    }

    if (data.price !== undefined) {
      if (typeof data.price !== 'number' || isNaN(data.price)) {
        errors.push({ field: 'price', message: 'Price must be a valid number' });
      } else if (data.price < 0) {
        errors.push({ field: 'price', message: 'Price must be non-negative' });
      }
    }

    return errors;
  }
}
