import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Odc }           from './entities/odc.entity';
import { OdcService }    from './odc.service';
import { OdcController } from './odc.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Odc])],
  controllers: [OdcController],
  providers: [OdcService],
  exports: [OdcService],
})
export class OdcModule {}
