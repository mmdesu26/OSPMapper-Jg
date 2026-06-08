import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule }     from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService }  from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService }    from './auth.service';
import { JwtStrategy }    from './strategies/jwt.strategy';
import { User }           from './entities/user.entity';
import { Role }           from './entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get('JWT_ACCESS_SECRET', 'fallback_secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, TypeOrmModule],
})
export class AuthModule implements OnModuleInit {
  constructor(private auth: AuthService) {}
  async onModuleInit() { await this.auth.seedDefaultData(); }
}
