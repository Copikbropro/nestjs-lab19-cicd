import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    const defaultRoles = [
      { name: 'user', description: 'Стандартный пользователь системы' },
      { name: 'administrator', description: 'Администратор с полными правами доступа' },
    ];

    for (const roleData of defaultRoles) {
      const exists = await this.roleRepository.findOne({ where: { name: roleData.name } });
      if (!exists) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
      }
    }
  }

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find();
  }

  async findByName(name: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { name } });
    if (!role) {
      throw new NotFoundException(`Роль "${name}" не найдена`);
    }
    return role;
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const existing = await this.roleRepository.findOne({ where: { name } });
    if (existing) {
      return existing;
    }
    const role = this.roleRepository.create({ name, description });
    return this.roleRepository.save(role);
  }
}
