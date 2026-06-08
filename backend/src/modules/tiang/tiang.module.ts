import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tiang } from './entities/tiang.entity';
import { TiangService } from './tiang.service';
import { TiangController } from './tiang.controller';
@Module({ imports: [TypeOrmModule.forFeature([Tiang])], controllers: [TiangController], providers: [TiangService], exports: [TiangService] })
export class TiangModule {}
