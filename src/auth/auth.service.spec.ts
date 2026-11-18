import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService (Юнит-тесты для CI/CD пайплайна ЛР №19)', () => {
  let authService: AuthService;
  let usersService: Partial<UsersService>;
  let jwtService: Partial<JwtService>;

  beforeEach(async () => {
    usersService = {
      create: jest.fn().mockImplementation(async (dto) => ({
        id: 1,
        email: dto.email,
        username: dto.username,
        password: dto.password,
        roles: [{ id: 1, name: dto.roleName || 'user' }],
      })),
      findByUsernameOrEmail: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  it('должен хешировать пароль через bcrypt при регистрации и не возвращать его в ответе', async () => {
    const response = await authService.register({
      email: 'test@psu.by',
      username: 'tester',
      password: 'secretPassword123',
    });

    expect(response.message).toBe('Пользователь успешно зарегистрирован');
    expect(response.user).not.toHaveProperty('password');
    expect(usersService.create).toHaveBeenCalledTimes(1);

    const passedArg = (usersService.create as jest.Mock).mock.calls[0][0];
    expect(passedArg.password).not.toBe('secretPassword123');
    const isMatch = await bcrypt.compare('secretPassword123', passedArg.password);
    expect(isMatch).toBe(true);
  });

  it('должен выдавать JWT-токен при успешном входе (login)', async () => {
    const result = await authService.login({
      id: 1,
      username: 'tester',
      email: 'test@psu.by',
      roles: [{ name: 'user' }],
    });

    expect(result).toEqual({
      access_token: 'mocked.jwt.token',
      token_type: 'Bearer',
      user: {
        id: 1,
        username: 'tester',
        email: 'test@psu.by',
        roles: ['user'],
      },
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 1,
      username: 'tester',
      email: 'test@psu.by',
      roles: ['user'],
    });
  });
});
