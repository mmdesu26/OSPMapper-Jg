import { IsString, IsNumber, IsOptional, IsEnum, MinLength, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateOdcDto {
  @ApiProperty({ example: 'ODC-JKT-007' }) @IsString() @MinLength(3) kode_odc: string;
  @ApiProperty({ example: 'ODC Sudirman' }) @IsString() @MinLength(2) nama_odc: string;
  @ApiProperty({ example: -6.2088 }) @IsNumber() @Min(-90) @Max(90) @Type(() => Number) latitude: number;
  @ApiProperty({ example: 106.8456 }) @IsNumber() @Min(-180) @Max(180) @Type(() => Number) longitude: number;
  @ApiPropertyOptional() @IsOptional() @IsString() site_id?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() alamat?: string;
  @ApiProperty({ default: 16 }) @IsInt() @Min(1) @Type(() => Number) kapasitas_port: number;
  @ApiPropertyOptional() @IsOptional() @IsString() foto_url?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() catatan?: string;
}

export class UpdateOdcDto extends PartialType(CreateOdcDto) {
  @ApiPropertyOptional({ enum: ['aktif','penuh','maintenance','non_aktif'] })
  @IsOptional() @IsEnum(['aktif','penuh','maintenance','non_aktif']) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Type(() => Number) port_terpakai?: number;
}

export class FilterOdcDto {
  @IsOptional() @Type(() => Number) @IsInt() page?:  number = 1;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number = 20;
  @IsOptional() @IsString() q?:      string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() site_id?: string;
}
