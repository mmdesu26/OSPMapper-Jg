import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Odp } from './entities/odp.entity';
import { OdpPort } from './entities/odp-port.entity';
import { Odc } from '../odc/entities/odc.entity';
import { OdpService } from './odp.service';
import { OdpController } from './odp.controller';
@Module({ imports: [TypeOrmModule.forFeature([Odp, OdpPort, Odc])], controllers: [OdpController], providers: [OdpService], exports: [OdpService] })
export class OdpModule {}
