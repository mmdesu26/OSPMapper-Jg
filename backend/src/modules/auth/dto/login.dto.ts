// dto/login.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty({ example: 'admin@ospmapper.id' }) @IsEmail() email: string;
  @ApiProperty({ example: 'Admin@12345' }) @IsString() @MinLength(6) password: string;
}
