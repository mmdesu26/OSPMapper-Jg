import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule }     from './modules/auth/auth.module';
import { OdcModule }      from './modules/odc/odc.module';
import { OdpModule }      from './modules/odp/odp.module';
import { JcModule }       from './modules/jc/jc.module';
import { TiangModule }    from './modules/tiang/tiang.module';
import { KabelModule }    from './modules/kabel/kabel.module';
import { MapModule }      from './modules/map/map.module';
import { SiteModule }     from './modules/site/site.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../.env'] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    DatabaseModule,
    AuthModule,
    SiteModule,
    OdcModule,
    OdpModule,
    JcModule,
    TiangModule,
    KabelModule,
    MapModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
