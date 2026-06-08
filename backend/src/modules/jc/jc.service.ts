import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Jc } from './entities/jc.entity';

@Injectable()
export class JcService {
  constructor(@InjectRepository(Jc) private repo: Repository<Jc>) {}

  async findAll(f: any) {
    const where: any = { deleted_at: IsNull() };
    if (f.site_id) where.site = { id: f.site_id };
    const page = Number(f.page || 1);
    const limit = Number(f.limit || 20);
    const [data, total] = await this.repo.findAndCount({
      where: f.q ? [{ ...where, kode_jc: Like(`%${f.q}%`) }, { ...where, tipe_jc: Like(`%${f.q}%`) }] : where,
      relations: ['site'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id, deleted_at: IsNull() }, relations: ['site'] });
    if (!item) throw new NotFoundException('JC tidak ditemukan');
    return item;
  }

  async create(dto: any, userId: string) {
    const exists = await this.repo.findOne({ where: { kode_jc: dto.kode_jc } });
    if (exists) throw new ConflictException(`Kode ${dto.kode_jc} sudah ada`);
    const { site_id, ...rest } = dto;
    return this.repo.save(this.repo.create({
      ...rest,
      site: site_id ? { id: site_id } as any : null,
      createdBy: { id: userId },
      updatedBy: { id: userId },
    } as any));
  }

  async update(id: string, dto: any, userId: string) {
    const item = await this.findOne(id);
    const { site_id, ...rest } = dto;
    Object.assign(item, rest, { updatedBy: { id: userId } });
    if (site_id !== undefined) item.site = site_id ? { id: site_id } as any : null as any;
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { deleted_at: new Date() });
  }
}
