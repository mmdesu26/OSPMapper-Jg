import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository }       from 'typeorm';
import { JwtService }       from '@nestjs/jwt';
import { ConfigService }    from '@nestjs/config';
import * as bcrypt          from 'bcryptjs';
import { User }             from './entities/user.entity';
import { Role }             from './entities/role.entity';
import { LoginDto }         from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private cfg: ConfigService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, is_active: true },
      relations: ['role'],
    });
    if (!user) throw new UnauthorizedException('Email atau password salah');
    const valid = await bcrypt.compare(dto.password, user.password_hash);
    if (!valid) throw new UnauthorizedException('Email atau password salah');

    await this.userRepo.update(user.id, { last_login_at: new Date() });

    const payload = { sub: user.id, email: user.email, role: user.role?.name };
    const accessToken  = this.jwtService.sign(payload, { expiresIn: '15m',
      secret: this.cfg.get('JWT_ACCESS_SECRET') });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d',
      secret: this.cfg.get('JWT_REFRESH_SECRET') });

    const hash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.update(user.id, { refresh_token: hash });

    return {
      accessToken, refreshToken,
      user: { id: user.id, email: user.email, full_name: user.full_name,
               role: user.role?.name, region: user.region },
    };
  }

  async refresh(userId: string, token: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.refresh_token) throw new UnauthorizedException();
    const ok = await bcrypt.compare(token, user.refresh_token);
    if (!ok) throw new UnauthorizedException('Refresh token tidak valid');
    const payload = { sub: user.id, email: user.email, role: user.role?.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m',
      secret: this.cfg.get('JWT_ACCESS_SECRET') });
    return { accessToken };
  }

  async logout(userId: string) {
    await this.userRepo.update(userId, { refresh_token: undefined });
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new NotFoundException('User tidak ditemukan');
    const { password_hash, refresh_token, ...safe } = user as any;
    return safe;
  }

  async seedDefaultData() {
    const roleCount = await this.roleRepo.count();
    if (roleCount > 0) return;
    const roles = [
      { name: 'super_admin', label: 'Super Administrator', permissions: { all: true } },
      { name: 'noc_admin',   label: 'NOC Administrator',   permissions: { read: true, write: true, approve: true } },
      { name: 'lapangan',    label: 'Tim Lapangan',        permissions: { read: true, write: true, own_only: true } },
      { name: 'viewer',      label: 'Viewer',              permissions: { read: true } },
    ];
    for (const r of roles) await this.roleRepo.save(this.roleRepo.create(r));

    const adminRole = await this.roleRepo.findOne({ where: { name: 'super_admin' } });
    if (!adminRole) throw new Error('Failed to create super_admin role');
    const hash = await bcrypt.hash('Admin@12345', 12);
    const adminUser = this.userRepo.create({
      email: 'admin@ospmapper-jagonet.id', password_hash: hash,
      full_name: 'Super Admin', phone: '081234567890',
      region: 'Jakarta',
    });
    adminUser.role = adminRole;
    await this.userRepo.save(adminUser);
    console.log('✅ Seed data created. Login: admin@ospmapper.id / Admin@12345');
  }
}
