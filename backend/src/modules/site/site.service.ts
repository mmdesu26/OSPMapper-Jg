import { Injectable, ConflictException, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { Site } from './entities/site.entity';

@Injectable()
export class SiteService implements OnModuleInit {
  constructor(@InjectRepository(Site) private repo: Repository<Site>) {}

  async onModuleInit() {
    await this.seedDefaultSites();
  }

  async seedDefaultSites() {
    const defaults = ['Magetan', 'Ngawi', 'Ponorogo', 'Bojonegoro', 'Bali'];
    for (const name of defaults) {
      const kode = `SITE-${name.toUpperCase().replace(/\s+/g, '-')}`;
      const exists = await this.repo.findOne({ where: { kode_site: kode } });
      if (!exists) {
        await this.repo.save(this.repo.create({
          kode_site: kode,
          nama_site: name,
          kota: name,
          provinsi: name === 'Bali' ? 'Bali' : 'Jawa Timur',
          status: 'aktif',
          catatan: 'Data awal sistem OSP MAPPER JAGONET',
        }));
      }
    }
  }

  async findAll(f: any = {}) {
    const where: any = { deleted_at: IsNull() };
    if (f.status) where.status = f.status;
    const page = Number(f.page || 1);
    const limit = Number(f.limit || 20);
    const [data, total] = await this.repo.findAndCount({
      where: f.q ? [
        { ...where, kode_site: Like(`%${f.q}%`) },
        { ...where, nama_site: Like(`%${f.q}%`) },
        { ...where, kota: Like(`%${f.q}%`) },
      ] : where,
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 } };
  }

  async findOne(id: string) {
    const item = await this.repo.findOne({ where: { id, deleted_at: IsNull() } });
    if (!item) throw new NotFoundException('Site tidak ditemukan');
    return item;
  }

  async create(dto: any, userId: string) {
    const exists = await this.repo.findOne({ where: { kode_site: dto.kode_site } });
    if (exists) throw new ConflictException(`Kode ${dto.kode_site} sudah ada`);
    return this.repo.save(this.repo.create({ ...dto, createdBy: { id: userId }, updatedBy: { id: userId } }));
  }

  async update(id: string, dto: any, userId: string) {
    const item = await this.findOne(id);
    Object.assign(item, dto, { updatedBy: { id: userId } });
    return this.repo.save(item);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.repo.update(id, { deleted_at: new Date() });
  }
}
