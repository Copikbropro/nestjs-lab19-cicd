import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly usersService: UsersService,
  ) {}

  private sanitizeTask(task: Task) {
    if (task.user) {
      const { password, ...safeUser } = task.user;
      return { ...task, user: safeUser };
    }
    return task;
  }

  async create(createTaskDto: CreateTaskDto, userId: number) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      user,
    });
    const saved = await this.taskRepository.save(task);
    return this.sanitizeTask(saved);
  }

  async findAllForUser(currentUser: any) {
    const roleNames = (currentUser.roles || []).map((r: any) =>
      typeof r === 'string' ? r : r.name,
    );
    const isAdmin = roleNames.includes('administrator');

    const tasks = isAdmin
      ? await this.taskRepository.find({ order: { id: 'ASC' } })
      : await this.taskRepository.find({
          where: { user: { id: currentUser.userId } },
          order: { id: 'ASC' },
        });

    return tasks.map((t) => this.sanitizeTask(t));
  }

  async findAllAdmin() {
    const tasks = await this.taskRepository.find({ order: { id: 'ASC' } });
    return tasks.map((t) => this.sanitizeTask(t));
  }

  async findOne(id: number, currentUser: any) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    const roleNames = (currentUser.roles || []).map((r: any) =>
      typeof r === 'string' ? r : r.name,
    );
    const isAdmin = roleNames.includes('administrator');

    if (!isAdmin && task.user?.id !== currentUser.userId) {
      throw new ForbiddenException('У вас нет доступа к этой задаче');
    }

    return this.sanitizeTask(task);
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, currentUser: any) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }

    const roleNames = (currentUser.roles || []).map((r: any) =>
      typeof r === 'string' ? r : r.name,
    );
    const isAdmin = roleNames.includes('administrator');

    if (!isAdmin && task.user?.id !== currentUser.userId) {
      throw new ForbiddenException('У вас нет прав на изменение этой задачи');
    }

    Object.assign(task, updateTaskDto);
    const updated = await this.taskRepository.save(task);
    return this.sanitizeTask(updated);
  }

  async remove(id: number) {
    const task = await this.taskRepository.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Задача с ID ${id} не найдена`);
    }
    await this.taskRepository.remove(task);
    return {
      message: `Задача с ID ${id} успешно удалена администратором`,
    };
  }
}
