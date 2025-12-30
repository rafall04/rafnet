import { PackageRepository, PackageEntity, CreatePackageData, UpdatePackageData } from '../repositories/package.repository';

export interface Package {
  id: number;
  name: string;
  speed: string;
  price: number;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePackageDTO {
  name: string;
  speed: string;
  price: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePackageDTO {
  name?: string;
  speed?: string;
  price?: number;
  description?: string;
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

export class PackageService {
  constructor(private repository: PackageRepository) {}

  private mapEntityToPackage(entity: PackageEntity): Package {
    return {
      id: entity.id,
      name: entity.name,
      speed: entity.speed,
      price: entity.price,
      description: entity.description,
      isActive: entity.is_active === 1,
      createdAt: new Date(entity.created_at),
      updatedAt: new Date(entity.updated_at)
    };
  }

  findAll(): Package[] {
    return this.repository.findAll().map(e => this.mapEntityToPackage(e));
  }

  findActive(): Package[] {
    return this.repository.findActive().map(e => this.mapEntityToPackage(e));
  }

  findById(id: number): Package | null {
    const entity = this.repository.findById(id);
    return entity ? this.mapEntityToPackage(entity) : null;
  }

  create(data: CreatePackageDTO): Package {
    const errors = this.validateCreate(data);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    const createData: CreatePackageData = {
      name: data.name.trim(),
      speed: data.speed.trim(),
      price: data.price,
      description: data.description?.trim(),
      isActive: data.isActive
    };

    const entity = this.repository.create(createData);
    return this.mapEntityToPackage(entity);
  }

  update(id: number, data: UpdatePackageDTO): Package | null {
    const errors = this.validateUpdate(data);
    if (errors.length > 0) {
      throw new ValidationException(errors);
    }

    const updateData: UpdatePackageData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.speed !== undefined) updateData.speed = data.speed.trim();
    if (data.price !== undefined) updateData.price = data.price;
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const entity = this.repository.update(id, updateData);
    return entity ? this.mapEntityToPackage(entity) : null;
  }

  delete(id: number): boolean {
    return this.repository.delete(id);
  }

  private validateCreate(data: CreatePackageDTO): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (!data.speed || data.speed.trim().length === 0) {
      errors.push({ field: 'speed', message: 'Speed is required' });
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

  private validateUpdate(data: UpdatePackageDTO): ValidationError[] {
    const errors: ValidationError[] = [];

    if (data.name !== undefined && data.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    }

    if (data.speed !== undefined && data.speed.trim().length === 0) {
      errors.push({ field: 'speed', message: 'Speed cannot be empty' });
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
