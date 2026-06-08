import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Role }      from '../modules/auth/entities/role.entity';
import { User }      from '../modules/auth/entities/user.entity';
import { Odc }       from '../modules/odc/entities/odc.entity';
import { Odp }       from '../modules/odp/entities/odp.entity';
import { OdpPort }   from '../modules/odp/entities/odp-port.entity';
import { Jc }        from '../modules/jc/entities/jc.entity';
import { Tiang }     from '../modules/tiang/entities/tiang.entity';
import { Kabel }     from '../modules/kabel/entities/kabel.entity';
import { CableCore } from '../modules/kabel/entities/cable-core.entity';
import { Site }      from '../modules/site/entities/site.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const sync = cfg.get<string>('DB_SYNC');
        const synchronize = sync === undefined ? cfg.get('NODE_ENV') !== 'production' : sync === 'true';

        return {
          type: 'mysql',
          host:     cfg.get('DB_HOST', 'localhost'),
          port:     Number(cfg.get('DB_PORT', 3306)),
          database: cfg.get('DB_NAME', 'osp_mapper'),
          username: cfg.get('DB_USER', 'root'),
          password: cfg.get('DB_PASS', ''),
          entities: [Role, User, Site, Odc, Odp, OdpPort, Jc, Tiang, Kabel, CableCore],
          synchronize,
          logging: false,
          extra: { connectionLimit: 10 },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
