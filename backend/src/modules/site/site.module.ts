import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteService } from './site.service';
import { SiteController } from './site.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  controllers: [SiteController],
  providers: [SiteService],
  exports: [SiteService, TypeOrmModule],
})
export class SiteModule {}
