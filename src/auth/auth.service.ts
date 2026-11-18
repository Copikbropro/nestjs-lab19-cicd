import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const newUser = await this.usersService.create({
      email: registerDto.email,
      username: registerDto.username,
      password: hashedPassword,
      roleName: registerDto.role,
    });

    const { password, ...result } = newUser;
    return {
      message: 'Пользователь успешно зарегистрирован',
      user: result,
    };
  }

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsernameOrEmail(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const roleNames = user.roles ? user.roles.map((r: any) => r.name) : [];
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: roleNames,
    };

    return {
      access_token: this.jwtService.sign(payload),
      token_type: 'Bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: roleNames,
      },
    };
  }
}
