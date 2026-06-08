import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Jc } from './entities/jc.entity';
import { JcService } from './jc.service';
import { JcController } from './jc.controller';
@Module({ imports: [TypeOrmModule.forFeature([Jc])], controllers: [JcController], providers: [JcService], exports: [JcService] })
export class JcModule {}
