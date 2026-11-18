import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RolesService } from '../roles/roles.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly rolesService: RolesService,
  ) {}

  async create(userData: {
    email: string;
    username: string;
    password: string;
    roleName?: string;
  }): Promise<User> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: userData.username },
    });
    if (existingUsername) {
      throw new ConflictException('Пользователь с таким username уже существует');
    }

    const targetRoleName = userData.roleName || 'user';
    const role = await this.rolesService.findByName(targetRoleName);

    const user = this.userRepository.create({
      email: userData.email,
      username: userData.username,
      password: userData.password,
      roles: [role],
    });

    return this.userRepository.save(user);
  }

  async findByUsernameOrEmail(login: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ username: login }, { email: login }],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    const users = await this.userRepository.find();
    return users.map(({ password, ...rest }) => rest);
  }

  async assignRole(userId: number, roleName: string): Promise<Omit<User, 'password'>> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${userId} не найден`);
    }

    const role = await this.rolesService.findByName(roleName);
    const alreadyHasRole = user.roles.some((r) => r.name === role.name);

    if (!alreadyHasRole) {
      user.roles.push(role);
      await this.userRepository.save(user);
    }

    const { password, ...result } = user;
    return result;
  }
}
