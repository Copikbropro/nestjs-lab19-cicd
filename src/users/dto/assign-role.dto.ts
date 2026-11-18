import { IsString, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Название роли не может быть пустым' })
  roleName: string;
}
