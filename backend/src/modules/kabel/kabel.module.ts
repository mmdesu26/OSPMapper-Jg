import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Kabel }         from './entities/kabel.entity';
import { CableCore }     from './entities/cable-core.entity';
import { KabelService }  from './kabel.service';
import { KabelController } from './kabel.controller';
@Module({ imports: [TypeOrmModule.forFeature([Kabel, CableCore])], controllers: [KabelController], providers: [KabelService], exports: [KabelService] })
export class KabelModule {}
