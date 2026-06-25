import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '../../common/enums';

export class AddMemberDto {
  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Role, example: Role.EDITOR })
  @IsEnum(Role)
  role: Role;
}
